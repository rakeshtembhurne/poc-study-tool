import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '../core/config/config.service';
import { AuthService } from '../auth/auth.service';
import { AuthController } from '../auth/auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../core/config/config.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtConfig = configService.getJwtConfig();
        return {
          secret: jwtConfig.secret,
          signOptions: {
            expiresIn: jwtConfig.accessExpiry,
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
