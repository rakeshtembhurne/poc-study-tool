import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConnectionManager } from './connection-manager.service';

interface ModelError {
  model: string;
  error: string;
  timestamp: string;
  attempt: number;
}

@Injectable()
export class FlashcardGenerator {
  private readonly logger = new Logger(FlashcardGenerator.name);
  private readonly RETRY_DELAY_MS = 1500;
  private readonly REQUEST_TIMEOUT_MS = 45000;

  constructor(private readonly connectionManager: ConnectionManager) {}

  async generate(text: string, apiKey: string, models: string[]): Promise<any> {
    const client = this.connectionManager.getClient(apiKey);
    const maxAttempts = Math.min(models.length, 5);
    const modelErrors: ModelError[] = [];
    const startTime = Date.now();

    const prompt = `Create concise flashcards from the following text. Format each flashcard as:
Q: [clear, specific question]
A: [brief, accurate answer]

Guidelines:
- Generate as many unique and relevant flashcards as possible
- Keep questions clear and specific
- Keep answers brief but complete
- Focus on key concepts, facts, and important details

Text to create flashcards from:
${text.trim()}`;

    this.logger.log(
      `Starting flashcard generation with ${maxAttempts} max attempts across ${models.length} models`
    );

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const currentModel = models[attempt % models.length];
      const attemptStartTime = Date.now();

      this.logger.log(
        `Attempt ${attempt + 1}/${maxAttempts}: Generating flashcards with model "${currentModel}"`
      );

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(`Request timeout after ${this.REQUEST_TIMEOUT_MS}ms`)
              ),
            this.REQUEST_TIMEOUT_MS
          )
        );

        const completionPromise = client.chat.completions.create({
          model: currentModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: Math.min(2048, 4000),
          temperature: 0.3,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
        });

        const completion = (await Promise.race([
          completionPromise,
          timeoutPromise,
        ])) as any;
        const attemptElapsedTime = Date.now() - attemptStartTime;

        if (!this.validateFlashcardResponse(completion)) {
          throw new Error(
            'Generated response does not contain valid flashcard content'
          );
        }

        this.logger.log(
          `✅ Successfully generated flashcards with model "${currentModel}" in ${attemptElapsedTime}ms. ` +
            `Usage: ${completion.usage?.total_tokens || 'unknown'} tokens`
        );

        const totalElapsedTime = Date.now() - startTime;
        this.logger.log(`Total generation time: ${totalElapsedTime}ms`);

        return completion;
      } catch (error: any) {
        const attemptElapsedTime = Date.now() - attemptStartTime;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        const errorCode = error?.code || error?.type || 'UNKNOWN';

        this.logger.warn(
          `❌ Attempt ${attempt + 1} failed for model "${currentModel}" in ${attemptElapsedTime}ms: [${errorCode}] ${errorMessage}`
        );

        modelErrors.push({
          model: currentModel,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          attempt: attempt + 1,
        });

        if (attempt < maxAttempts - 1) {
          await this.delay(this.RETRY_DELAY_MS);
        }
      }
    }

    // All attempts failed
    const totalElapsedTime = Date.now() - startTime;

    this.logger.error(
      `Failed to generate flashcards after ${maxAttempts} attempts in ${totalElapsedTime}ms`,
      { modelErrors }
    );

    throw new HttpException(
      {
        message:
          'Unable to generate flashcards. All available AI models failed to respond.',
        details:
          'This might be due to high API usage, model unavailability, or service issues.',
        attempts: maxAttempts,
        totalTimeMs: totalElapsedTime,
        modelErrors: modelErrors.map(({ model, error }) => ({ model, error })),
        suggestedActions: [
          'Try again in a few minutes',
          'Check if your API key is valid and has sufficient credits',
          'Try with a shorter text input',
        ],
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }

  private validateFlashcardResponse(response: any): boolean {
    try {
      if (!response?.choices?.[0]?.message?.content) {
        return false;
      }

      const content = response.choices[0].message.content.trim();
      if (content.length < 10) {
        return false;
      }

      const hasQuestionPattern = /Q\s*:/i.test(content);
      const hasAnswerPattern = /A\s*:/i.test(content);

      return hasQuestionPattern && hasAnswerPattern;
    } catch (error) {
      this.logger.debug('Response validation failed:', error);
      return false;
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
