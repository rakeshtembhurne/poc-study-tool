export interface QueueJob<T = any> {
  id: string;
  data: T;
  priority?: number;
  delay?: number;
  attempts?: number;
  maxAttempts?: number;
  createdAt: Date;
  processingStartedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'delayed';

export interface QueueOptions {
  maxConcurrency?: number;
  defaultJobOptions?: Partial<QueueJob>;
  retryDelayMs?: number;
  jobTimeoutMs?: number;
}

export interface IQueue<T = any> {
  add(data: T, options?: Partial<QueueJob>): Promise<QueueJob<T>>;
  process(processor: (job: QueueJob<T>) => Promise<void>): void;
  getJob(id: string): Promise<QueueJob<T> | null>;
  getJobs(status?: JobStatus): Promise<QueueJob<T>[]>;
  removeJob(id: string): Promise<boolean>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  clear(): Promise<void>;
  getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }>;
}
