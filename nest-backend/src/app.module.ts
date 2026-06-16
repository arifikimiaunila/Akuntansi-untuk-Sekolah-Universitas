import { Module } from '@nestjs/common';
import { DefaultController } from './controllers/default.controller';
import { PembayaranController } from './controllers/pembayaran.controller';
import { PembayaranService } from './services/pembayaran.service';
import { KafkaService } from './kafka/kafka.service';

@Module({
  imports: [],
  controllers: [DefaultController, PembayaranController],
  providers: [PembayaranService, KafkaService],
})
export class AppModule {}
