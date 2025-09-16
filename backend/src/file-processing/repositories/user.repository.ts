import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

export interface UserApiKeyData {
  id: string;
  openAiApiKey: string | null;
  processingFileCount?: number;
}

export interface IUserRepository {
  findUserApiKey(userId: string): Promise<UserApiKeyData | null>;
  findUserWithProcessingStats(userId: string): Promise<UserApiKeyData | null>;
}

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findUserApiKey(userId: string): Promise<UserApiKeyData | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        openAiApiKey: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id.toString(),
      openAiApiKey: user.openAiApiKey,
    };
  }

  async findUserWithProcessingStats(
    userId: string
  ): Promise<UserApiKeyData | null> {
    const user = await this.prismaService.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        openAiApiKey: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id.toString(),
      openAiApiKey: user.openAiApiKey,
      processingFileCount: 0, // Would need to implement this based on actual schema
    };
  }
}
