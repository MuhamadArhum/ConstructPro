import { Module } from '@nestjs/common';
import { BoqController } from './boq.controller';
import { BoqService } from './boq.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BoqController],
  providers: [BoqService],
})
export class BoqModule {}
