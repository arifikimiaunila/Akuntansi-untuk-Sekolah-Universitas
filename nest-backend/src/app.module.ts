import { Module } from '@nestjs/common';
import { DefaultController } from './controllers/default.controller';
import { PembayaranController } from './controllers/pembayaran.controller';
import { PembayaranService } from './services/pembayaran.service';
import { KafkaService } from './kafka/kafka.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { RkasAnggaranEntity } from './entities/rkas-anggaran.entity';
import { TransaksiAkuntansiEntity } from './entities/transaksi-akuntansi.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'akuntansi_sekolah',
      entities: [TransaksiAkuntansiEntity, RkasAnggaranEntity],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([TransaksiAkuntansiEntity, RkasAnggaranEntity]),
  ],
  controllers: [DefaultController, PembayaranController, AuthController],
  providers: [PembayaranService, KafkaService, AuthService],
})
export class AppModule {}
