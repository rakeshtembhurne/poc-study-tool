import { Module } from '@nestjs/common';
import { SM15Service } from './sm15.service';
import { OFMatrixService } from './services/of-matrix.service';
import { RecallMatrixService } from './services/recall-matrix.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SM15Service, OFMatrixService, RecallMatrixService],
  exports: [SM15Service, OFMatrixService, RecallMatrixService],
})
export class AlgorithmModule {}
