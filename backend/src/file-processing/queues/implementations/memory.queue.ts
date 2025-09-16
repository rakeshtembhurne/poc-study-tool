import { Injectable, Logger } from '@nestjs/common';
import {
  IQueue,
  QueueJob,
  JobStatus,
  QueueOptions,
} from '../interfaces/queue.interface';

@Injectable()
export class MemoryQueue<T = any> implements IQueue<T> {
  private readonly logger = new Logger(MemoryQueue.name);
  private jobs = new Map<string, QueueJob<T>>();
  private processingQueue: QueueJob<T>[] = [];
  private processor?: (job: QueueJob<T>) => Promise<void>;
  private isProcessing = false;
  private isPaused = false;
  private processingCount = 0;

  constructor(
    private readonly name: string,
    private readonly options: QueueOptions = {}
  ) {
    this.options = {
      maxConcurrency: 1,
      retryDelayMs: 5000,
      jobTimeoutMs: 300000, // 5 minutes
      ...options,
    };
  }

  async add(data: T, options: Partial<QueueJob> = {}): Promise<QueueJob<T>> {
    const job: QueueJob<T> = {
      id: this.generateJobId(),
      data,
      priority: 0,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      ...this.options.defaultJobOptions,
      ...options,
    };

    this.jobs.set(job.id, job);

    if (job.delay && job.delay > 0) {
      setTimeout(() => this.addToProcessingQueue(job), job.delay);
    } else {
      this.addToProcessingQueue(job);
    }

    this.logger.debug(`Job ${job.id} added to queue ${this.name}`);
    return job;
  }

  process(processor: (job: QueueJob<T>) => Promise<void>): void {
    this.processor = processor;
    void this.startProcessing();
  }

  async getJob(id: string): Promise<QueueJob<T> | null> {
    return this.jobs.get(id) || null;
  }

  async getJobs(status?: JobStatus): Promise<QueueJob<T>[]> {
    const allJobs = Array.from(this.jobs.values());

    if (!status) {
      return allJobs;
    }

    return allJobs.filter((job) => this.getJobStatus(job) === status);
  }

  async removeJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job) return false;

    // Remove from processing queue if pending
    const index = this.processingQueue.findIndex((j) => j.id === id);
    if (index !== -1) {
      this.processingQueue.splice(index, 1);
    }

    this.jobs.delete(id);
    this.logger.debug(`Job ${id} removed from queue ${this.name}`);
    return true;
  }

  async pause(): Promise<void> {
    this.isPaused = true;
    this.logger.log(`Queue ${this.name} paused`);
  }

  async resume(): Promise<void> {
    this.isPaused = false;
    this.logger.log(`Queue ${this.name} resumed`);
    void this.startProcessing();
  }

  async clear(): Promise<void> {
    this.processingQueue = [];
    this.jobs.clear();
    this.logger.log(`Queue ${this.name} cleared`);
  }

  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const allJobs = Array.from(this.jobs.values());

    return {
      pending: allJobs.filter((job) => this.getJobStatus(job) === 'pending')
        .length,
      processing: allJobs.filter(
        (job) => this.getJobStatus(job) === 'processing'
      ).length,
      completed: allJobs.filter((job) => this.getJobStatus(job) === 'completed')
        .length,
      failed: allJobs.filter((job) => this.getJobStatus(job) === 'failed')
        .length,
    };
  }

  private addToProcessingQueue(job: QueueJob<T>): void {
    // Insert job in priority order (higher priority first)
    const insertIndex = this.processingQueue.findIndex(
      (existingJob) => (existingJob.priority || 0) < (job.priority || 0)
    );

    if (insertIndex === -1) {
      this.processingQueue.push(job);
    } else {
      this.processingQueue.splice(insertIndex, 0, job);
    }

    void this.startProcessing();
  }

  private async startProcessing(): Promise<void> {
    if (
      this.isPaused ||
      !this.processor ||
      this.processingCount >= (this.options.maxConcurrency || 1)
    ) {
      return;
    }

    const job = this.processingQueue.shift();
    if (!job) return;

    this.processingCount++;
    job.processingStartedAt = new Date();
    this.jobs.set(job.id, job);

    this.logger.debug(`Processing job ${job.id} in queue ${this.name}`);

    try {
      // Set timeout for job processing
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Job timeout')),
          this.options.jobTimeoutMs
        );
      });

      await Promise.race([this.processor(job), timeoutPromise]);

      job.completedAt = new Date();
      this.jobs.set(job.id, job);
      this.logger.debug(`Job ${job.id} completed successfully`);
    } catch (error) {
      job.attempts = (job.attempts || 0) + 1;
      job.error = error instanceof Error ? error.message : String(error);

      if (job.attempts < (job.maxAttempts || 3)) {
        // Retry job after delay
        this.logger.warn(
          `Job ${job.id} failed, retrying (attempt ${job.attempts}/${job.maxAttempts})`
        );
        setTimeout(
          () => this.addToProcessingQueue(job),
          this.options.retryDelayMs
        );
      } else {
        // Mark as failed
        job.failedAt = new Date();
        this.jobs.set(job.id, job);
        this.logger.error(
          `Job ${job.id} failed permanently after ${job.attempts} attempts: ${job.error}`
        );
      }
    } finally {
      this.processingCount--;
      // Continue processing next job
      setImmediate(() => this.startProcessing());
    }
  }

  private getJobStatus(job: QueueJob<T>): JobStatus {
    if (job.failedAt) return 'failed';
    if (job.completedAt) return 'completed';
    if (job.processingStartedAt && !job.completedAt && !job.failedAt)
      return 'processing';
    if (
      job.delay &&
      job.delay > 0 &&
      Date.now() - job.createdAt.getTime() < job.delay
    )
      return 'delayed';
    return 'pending';
  }

  private generateJobId(): string {
    return `${this.name}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
