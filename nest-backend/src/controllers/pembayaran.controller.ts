import { Body, Controller, Get, Post } from '@nestjs/common';
import { PembayaranService, CreatePembayaranDto } from '../services/pembayaran.service';

@Controller('pembayaran')
export class PembayaranController {
  constructor(private readonly service: PembayaranService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreatePembayaranDto) {
    return this.service.create(dto);
  }
}
