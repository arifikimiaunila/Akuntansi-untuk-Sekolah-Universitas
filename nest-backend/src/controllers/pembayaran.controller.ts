import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CreatePembayaranDto,
  CreateRkasDto,
  LaporanFilterDto,
  PembayaranService,
  RkasFilterDto,
} from '../services/pembayaran.service';

@Controller('pembayaran')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PembayaranController {
  constructor(private readonly service: PembayaranService) {}

  @Get()
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  findAll(@Query() query: LaporanFilterDto) {
    return this.service.findAll(query);
  }

  @Get('ringkasan')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  summary(@Query() query: LaporanFilterDto) {
    return this.service.getSummary(query);
  }

  @Get('laporan')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT')
  report(@Query() query: LaporanFilterDto) {
    return this.service.getReport(query);
  }

  @Get('akuntansi/coa')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  coa() {
    return this.service.getCoa();
  }

  @Get('akuntansi/jurnal-umum')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  jurnalUmum(@Query() query: LaporanFilterDto) {
    return this.service.getJurnalUmum(query);
  }

  @Get('akuntansi/buku-besar')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  bukuBesar(@Query() query: LaporanFilterDto) {
    return this.service.getBukuBesar(query);
  }

  @Get('akuntansi/neraca-saldo')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  neracaSaldo(@Query() query: LaporanFilterDto) {
    return this.service.getNeracaSaldo(query);
  }

  @Get('akuntansi/laba-rugi')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  labaRugi(@Query() query: LaporanFilterDto) {
    return this.service.getLabaRugi(query);
  }

  @Get('akuntansi/neraca')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  neraca(@Query() query: LaporanFilterDto) {
    return this.service.getNeracaPosisi(query);
  }

  @Get('akuntansi/perubahan-aset-neto')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  perubahanAsetNeto(@Query() query: LaporanFilterDto) {
    return this.service.getPerubahanAsetNeto(query);
  }

  @Post('akuntansi/rkas')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT')
  createRkas(@Body() dto: CreateRkasDto) {
    return this.service.createRkas(dto);
  }

  @Get('akuntansi/rkas')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  listRkas(@Query() query: RkasFilterDto) {
    return this.service.listRkas(query);
  }

  @Get('akuntansi/rkas-vs-realisasi')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  rkasVsRealisasi(@Query() query: RkasFilterDto) {
    return this.service.getRkasVsRealisasi(query);
  }

  @Get('laporan/export/excel')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT')
  async exportExcel(@Query() query: LaporanFilterDto, @Res() res: Response) {
    const file = await this.service.exportExcel(query);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="laporan-akuntansi-${Date.now()}.xlsx"`,
    );
    res.send(file);
  }

  @Get('laporan/export/pdf')
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT')
  async exportPdf(@Query() query: LaporanFilterDto, @Res() res: Response) {
    const file = await this.service.exportPdf(query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="laporan-akuntansi-${Date.now()}.pdf"`,
    );
    res.send(file);
  }

  @Post()
  @Roles('ADMIN_YAYASAN', 'BENDAHARA_UNIT', 'OPERATOR_KAMPUS')
  create(@Body() dto: CreatePembayaranDto) {
    return this.service.create(dto);
  }
}
