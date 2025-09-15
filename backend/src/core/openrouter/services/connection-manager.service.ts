import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class ConnectionManager {
  private readonly logger = new Logger(ConnectionManager.name);
  private readonly openAIInstances = new Map<string, OpenAI>();
  private readonly REQUEST_TIMEOUT_MS = 45000;

  constructor(private readonly configService: ConfigService) {}

  getClient(apiKey: string): OpenAI {
    if (!this.openAIInstances.has(apiKey)) {
      this.openAIInstances.set(apiKey, this.createClient(apiKey));
      this.logger.debug(
        `Created new OpenAI client (total: ${this.openAIInstances.size})`
      );
    }
    return this.openAIInstances.get(apiKey)!;
  }

  private createClient(apiKey: string): OpenAI {
    const baseURL =
      this.configService.get('OPENROUTER_BASE_URL') ||
      'https://openrouter.ai/api/v1';

    return new OpenAI({
      baseURL,
      apiKey,
      timeout: this.REQUEST_TIMEOUT_MS,
      maxRetries: 0,
      defaultHeaders: {
        'User-Agent': 'OpenRouter-Service/1.0',
      },
    });
  }

  clearClient(apiKey: string): void {
    this.openAIInstances.delete(apiKey);
    this.logger.debug(
      `Cleared client (remaining: ${this.openAIInstances.size})`
    );
  }

  getStats(): { totalClients: number; clientKeys: string[] } {
    return {
      totalClients: this.openAIInstances.size,
      clientKeys: Array.from(this.openAIInstances.keys()).map(
        (key) => `${key.substring(0, 8)}...`
      ),
    };
  }
}
