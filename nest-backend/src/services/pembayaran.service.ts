import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Between, FindOptionsWhere, LessThan, Repository } from 'typeorm';
import { RkasAnggaranEntity } from '../entities/rkas-anggaran.entity';
import {
  JenisTransaksi,
  JenjangPendidikan,
  TransaksiAkuntansiEntity,
} from '../entities/transaksi-akuntansi.entity';

export interface CreatePembayaranDto {
  kode_peserta: string;
  nama_peserta: string;
  jenjang: JenjangPendidikan;
  unit: string;
  jenis_transaksi: JenisTransaksi;
  kategori: string;
  jumlah: number;
  tanggal_transaksi?: string;
  metode_pembayaran?: string;
  keterangan?: string;
}

export interface LaporanFilterDto {
  start?: string;
  end?: string;
  jenjang?: JenjangPendidikan;
  unit?: string;
}

export interface RingkasanJenjang {
  jenjang: JenjangPendidikan;
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
}

export interface RingkasanAkuntansi {
  total_pemasukan: number;
  total_pengeluaran: number;
  saldo_akhir: number;
  per_jenjang: RingkasanJenjang[];
}

export interface LaporanAkuntansi {
  filter: LaporanFilterDto;
  ringkasan: RingkasanAkuntansi;
  transaksi: TransaksiAkuntansiEntity[];
}

export interface AkunCoa {
  kode: string;
  nama: string;
  kelompok: 'ASET' | 'LIABILITAS' | 'EKUITAS' | 'PENDAPATAN' | 'BEBAN';
  saldo_normal: 'DEBIT' | 'KREDIT';
}

export interface JurnalLine {
  akun_kode: string;
  akun_nama: string;
  debit: number;
  kredit: number;
}

export interface JurnalEntry {
  ref: string;
  tanggal: string;
  deskripsi: string;
  lines: JurnalLine[];
}

export interface BukuBesarRow {
  tanggal: string;
  ref: string;
  deskripsi: string;
  debit: number;
  kredit: number;
  saldo: number;
}

export interface BukuBesarAkun {
  akun_kode: string;
  akun_nama: string;
  saldo_normal: 'DEBIT' | 'KREDIT';
  total_debit: number;
  total_kredit: number;
  saldo_akhir: number;
  rows: BukuBesarRow[];
}

export interface NeracaSaldoRow {
  akun_kode: string;
  akun_nama: string;
  debit: number;
  kredit: number;
}

export interface LabaRugiRow {
  jenjang: JenjangPendidikan;
  unit: string;
  pendapatan: number;
  beban: number;
  surplus_defisit: number;
}

export interface LabaRugiReport {
  total_pendapatan: number;
  total_beban: number;
  surplus_defisit: number;
  per_unit: LabaRugiRow[];
}

export interface NeracaPosRow {
  akun_kode: string;
  akun_nama: string;
  nilai: number;
}

export interface NeracaPendidikan {
  aset: NeracaPosRow[];
  liabilitas: NeracaPosRow[];
  aset_neto: NeracaPosRow[];
  total_aset: number;
  total_liabilitas: number;
  total_aset_neto: number;
}

export interface PerubahanAsetNeto {
  saldo_awal: number;
  surplus_defisit_periode: number;
  saldo_akhir: number;
  periode: { start?: string; end?: string };
}

export interface CreateRkasDto {
  tahun: number;
  jenjang: JenjangPendidikan;
  unit: string;
  kategori: string;
  akun_kode?: string;
  anggaran: number;
}

export interface RkasFilterDto {
  tahun: number;
  jenjang?: JenjangPendidikan;
  unit?: string;
}

export interface RkasVsRealisasiRow {
  tahun: number;
  jenjang: JenjangPendidikan;
  unit: string;
  kategori: string;
  akun_kode: string;
  anggaran: number;
  realisasi: number;
  selisih: number;
  persentase_realisasi: number;
}

export interface RkasVsRealisasiReport {
  tahun: number;
  total_anggaran: number;
  total_realisasi: number;
  total_selisih: number;
  rows: RkasVsRealisasiRow[];
}

@Injectable()
export class PembayaranService implements OnModuleInit {
  private readonly baseCoa: AkunCoa[] = [
    { kode: '1110', nama: 'Kas dan Bank', kelompok: 'ASET', saldo_normal: 'DEBIT' },
    { kode: '4110', nama: 'Pendapatan SPP/UKT', kelompok: 'PENDAPATAN', saldo_normal: 'KREDIT' },
    { kode: '4120', nama: 'Pendapatan Daftar Ulang', kelompok: 'PENDAPATAN', saldo_normal: 'KREDIT' },
    { kode: '4130', nama: 'Pendapatan Lain Pendidikan', kelompok: 'PENDAPATAN', saldo_normal: 'KREDIT' },
    { kode: '5110', nama: 'Beban Operasional Pendidikan', kelompok: 'BEBAN', saldo_normal: 'DEBIT' },
    { kode: '5120', nama: 'Beban ATK dan Laboratorium', kelompok: 'BEBAN', saldo_normal: 'DEBIT' },
    { kode: '5130', nama: 'Beban Kegiatan Akademik', kelompok: 'BEBAN', saldo_normal: 'DEBIT' },
  ];

  constructor(
    @InjectRepository(TransaksiAkuntansiEntity)
    private readonly transaksiRepo: Repository<TransaksiAkuntansiEntity>,
    @InjectRepository(RkasAnggaranEntity)
    private readonly rkasRepo: Repository<RkasAnggaranEntity>,
  ) {}

  async onModuleInit() {
    const [totalTransaksi, totalRkas] = await Promise.all([
      this.transaksiRepo.count(),
      this.rkasRepo.count(),
    ]);

    if (totalTransaksi === 0) {
      await this.seedData();
    }
    if (totalRkas === 0) {
      await this.seedRkas();
    }
  }

  async findAll(filter: LaporanFilterDto = {}): Promise<TransaksiAkuntansiEntity[]> {
    const where = this.buildWhere(filter);
    return this.transaksiRepo.find({ where, order: { id: 'DESC' } });
  }

  async getSummary(filter: LaporanFilterDto = {}): Promise<RingkasanAkuntansi> {
    const items = await this.findAll(filter);

    const summary: RingkasanAkuntansi = {
      total_pemasukan: 0,
      total_pengeluaran: 0,
      saldo_akhir: 0,
      per_jenjang: [],
    };

    const byJenjang = new Map<JenjangPendidikan, RingkasanJenjang>();

    for (const item of items) {
      if (item.jenis_transaksi === 'PEMASUKAN') {
        summary.total_pemasukan += Number(item.jumlah);
      } else {
        summary.total_pengeluaran += Number(item.jumlah);
      }

      const current = byJenjang.get(item.jenjang) || {
        jenjang: item.jenjang,
        pemasukan: 0,
        pengeluaran: 0,
        saldo: 0,
      };

      if (item.jenis_transaksi === 'PEMASUKAN') {
        current.pemasukan += Number(item.jumlah);
      } else {
        current.pengeluaran += Number(item.jumlah);
      }
      current.saldo = current.pemasukan - current.pengeluaran;
      byJenjang.set(item.jenjang, current);
    }

    summary.saldo_akhir = summary.total_pemasukan - summary.total_pengeluaran;
    summary.per_jenjang = [...byJenjang.values()].sort((a, b) => a.jenjang.localeCompare(b.jenjang));
    return summary;
  }

  async getReport(filter: LaporanFilterDto = {}): Promise<LaporanAkuntansi> {
    const [transaksi, ringkasan] = await Promise.all([this.findAll(filter), this.getSummary(filter)]);
    return { filter, ringkasan, transaksi };
  }

  async getCoa(): Promise<AkunCoa[]> {
    return this.baseCoa;
  }

  async getJurnalUmum(filter: LaporanFilterDto = {}): Promise<JurnalEntry[]> {
    const transaksi = await this.findAll(filter);
    return transaksi
      .map((trx) => this.mapTransactionToJournal(trx))
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }

  async getBukuBesar(filter: LaporanFilterDto = {}): Promise<BukuBesarAkun[]> {
    const jurnal = await this.getJurnalUmum(filter);
    const ledger = new Map<string, BukuBesarAkun>();

    for (const entry of jurnal) {
      for (const line of entry.lines) {
        const coa = this.baseCoa.find((a) => a.kode === line.akun_kode);
        const current = ledger.get(line.akun_kode) || {
          akun_kode: line.akun_kode,
          akun_nama: line.akun_nama,
          saldo_normal: coa?.saldo_normal || 'DEBIT',
          total_debit: 0,
          total_kredit: 0,
          saldo_akhir: 0,
          rows: [],
        };

        current.total_debit += line.debit;
        current.total_kredit += line.kredit;
        current.saldo_akhir =
          current.saldo_normal === 'DEBIT'
            ? current.total_debit - current.total_kredit
            : current.total_kredit - current.total_debit;

        current.rows.push({
          tanggal: entry.tanggal,
          ref: entry.ref,
          deskripsi: entry.deskripsi,
          debit: line.debit,
          kredit: line.kredit,
          saldo: current.saldo_akhir,
        });

        ledger.set(line.akun_kode, current);
      }
    }

    return [...ledger.values()].sort((a, b) => a.akun_kode.localeCompare(b.akun_kode));
  }

  async getNeracaSaldo(filter: LaporanFilterDto = {}): Promise<NeracaSaldoRow[]> {
    const bukuBesar = await this.getBukuBesar(filter);
    return bukuBesar.map((b) => ({
      akun_kode: b.akun_kode,
      akun_nama: b.akun_nama,
      debit: b.saldo_normal === 'DEBIT' ? Math.max(b.saldo_akhir, 0) : 0,
      kredit: b.saldo_normal === 'KREDIT' ? Math.max(b.saldo_akhir, 0) : 0,
    }));
  }

  async getLabaRugi(filter: LaporanFilterDto = {}): Promise<LabaRugiReport> {
    const items = await this.findAll(filter);
    const map = new Map<string, LabaRugiRow>();

    let totalPendapatan = 0;
    let totalBeban = 0;

    for (const item of items) {
      const key = `${item.jenjang}|${item.unit}`;
      const current = map.get(key) || {
        jenjang: item.jenjang,
        unit: item.unit,
        pendapatan: 0,
        beban: 0,
        surplus_defisit: 0,
      };

      if (item.jenis_transaksi === 'PEMASUKAN') {
        current.pendapatan += Number(item.jumlah);
        totalPendapatan += Number(item.jumlah);
      } else {
        current.beban += Number(item.jumlah);
        totalBeban += Number(item.jumlah);
      }

      current.surplus_defisit = current.pendapatan - current.beban;
      map.set(key, current);
    }

    return {
      total_pendapatan: totalPendapatan,
      total_beban: totalBeban,
      surplus_defisit: totalPendapatan - totalBeban,
      per_unit: [...map.values()].sort((a, b) => `${a.jenjang}${a.unit}`.localeCompare(`${b.jenjang}${b.unit}`)),
    };
  }

  async getNeracaPosisi(filter: LaporanFilterDto = {}): Promise<NeracaPendidikan> {
    const labaRugi = await this.getLabaRugi(filter);
    const kas = labaRugi.surplus_defisit;

    const aset: NeracaPosRow[] = [{ akun_kode: '1110', akun_nama: 'Kas dan Bank', nilai: kas }];
    const liabilitas: NeracaPosRow[] = [];
    const asetNeto: NeracaPosRow[] = [
      { akun_kode: '3100', akun_nama: 'Aset Neto Tidak Terikat', nilai: kas },
    ];

    return {
      aset,
      liabilitas,
      aset_neto: asetNeto,
      total_aset: kas,
      total_liabilitas: 0,
      total_aset_neto: kas,
    };
  }

  async getPerubahanAsetNeto(filter: LaporanFilterDto = {}): Promise<PerubahanAsetNeto> {
    const saldoPeriode = (await this.getLabaRugi(filter)).surplus_defisit;
    const startDate = filter.start ? new Date(filter.start) : undefined;

    if (!startDate) {
      return {
        saldo_awal: 0,
        surplus_defisit_periode: saldoPeriode,
        saldo_akhir: saldoPeriode,
        periode: { start: filter.start, end: filter.end },
      };
    }

    const whereBefore: FindOptionsWhere<TransaksiAkuntansiEntity> = this.buildWhere({
      jenjang: filter.jenjang,
      unit: filter.unit,
    });
    whereBefore.tanggal_transaksi = LessThan(startDate);

    const sebelumPeriode = await this.transaksiRepo.find({ where: whereBefore });
    let saldoAwal = 0;
    for (const t of sebelumPeriode) {
      saldoAwal += t.jenis_transaksi === 'PEMASUKAN' ? Number(t.jumlah) : -Number(t.jumlah);
    }

    return {
      saldo_awal: saldoAwal,
      surplus_defisit_periode: saldoPeriode,
      saldo_akhir: saldoAwal + saldoPeriode,
      periode: { start: filter.start, end: filter.end },
    };
  }

  async createRkas(dto: CreateRkasDto) {
    const payload: Partial<RkasAnggaranEntity> = {
      tahun: Number(dto.tahun),
      jenjang: dto.jenjang,
      unit: (dto.unit || '').trim(),
      kategori: (dto.kategori || '').trim(),
      akun_kode: (dto.akun_kode || '').trim(),
      anggaran: Number(dto.anggaran || 0),
    };

    if (!payload.tahun || payload.tahun < 2000) {
      throw new BadRequestException('tahun anggaran tidak valid');
    }
    if (!payload.unit) {
      throw new BadRequestException('unit tidak boleh kosong');
    }
    if (!payload.kategori) {
      throw new BadRequestException('kategori tidak boleh kosong');
    }
    if (!payload.anggaran || payload.anggaran <= 0) {
      throw new BadRequestException('anggaran harus lebih dari 0');
    }

    const saved = await this.rkasRepo.save(this.rkasRepo.create(payload));
    return { status: 'success', data: saved };
  }

  async listRkas(filter: Partial<RkasFilterDto> = {}): Promise<RkasAnggaranEntity[]> {
    const where: FindOptionsWhere<RkasAnggaranEntity> = {};
    if (filter.tahun) where.tahun = filter.tahun;
    if (filter.jenjang) where.jenjang = filter.jenjang;
    if (filter.unit) where.unit = filter.unit;
    return this.rkasRepo.find({ where, order: { tahun: 'DESC', jenjang: 'ASC', unit: 'ASC' } });
  }

  async getRkasVsRealisasi(filter: RkasFilterDto): Promise<RkasVsRealisasiReport> {
    const tahun = Number(filter.tahun);
    if (!tahun || tahun < 2000) {
      throw new BadRequestException('tahun wajib diisi');
    }

    const start = new Date(`${tahun}-01-01T00:00:00.000Z`);
    const end = new Date(`${tahun}-12-31T23:59:59.999Z`);

    const [rkasRows, transaksi] = await Promise.all([
      this.listRkas(filter),
      this.findAll({ start: start.toISOString(), end: end.toISOString(), jenjang: filter.jenjang, unit: filter.unit }),
    ]);

    const realizasiMap = new Map<string, number>();
    for (const t of transaksi) {
      const key = `${t.jenjang}|${t.unit}|${t.kategori}`;
      const curr = realizasiMap.get(key) || 0;
      realizasiMap.set(key, curr + Number(t.jumlah));
    }

    const output: RkasVsRealisasiRow[] = [];
    const used = new Set<string>();

    for (const row of rkasRows) {
      const key = `${row.jenjang}|${row.unit}|${row.kategori}`;
      const realisasi = realizasiMap.get(key) || 0;
      const anggaran = Number(row.anggaran);
      used.add(key);

      output.push({
        tahun: row.tahun,
        jenjang: row.jenjang,
        unit: row.unit,
        kategori: row.kategori,
        akun_kode: row.akun_kode,
        anggaran,
        realisasi,
        selisih: anggaran - realisasi,
        persentase_realisasi: anggaran > 0 ? Number(((realisasi / anggaran) * 100).toFixed(2)) : 0,
      });
    }

    for (const [key, realisasi] of realizasiMap.entries()) {
      if (used.has(key)) continue;
      const [jenjang, unit, kategori] = key.split('|');
      output.push({
        tahun,
        jenjang: jenjang as JenjangPendidikan,
        unit,
        kategori,
        akun_kode: '',
        anggaran: 0,
        realisasi,
        selisih: -realisasi,
        persentase_realisasi: 0,
      });
    }

    const totalAnggaran = output.reduce((n, r) => n + r.anggaran, 0);
    const totalRealisasi = output.reduce((n, r) => n + r.realisasi, 0);

    return {
      tahun,
      total_anggaran: totalAnggaran,
      total_realisasi: totalRealisasi,
      total_selisih: totalAnggaran - totalRealisasi,
      rows: output.sort((a, b) => `${a.jenjang}${a.unit}${a.kategori}`.localeCompare(`${b.jenjang}${b.unit}${b.kategori}`)),
    };
  }

  async create(dto: CreatePembayaranDto) {
    const payload: Partial<TransaksiAkuntansiEntity> = {
      kode_peserta: (dto.kode_peserta || '').trim(),
      nama_peserta: (dto.nama_peserta || '').trim(),
      jenjang: dto.jenjang,
      unit: (dto.unit || '').trim(),
      jenis_transaksi: dto.jenis_transaksi,
      kategori: (dto.kategori || '').trim(),
      jumlah: Number(dto.jumlah || 0),
      tanggal_transaksi: dto.tanggal_transaksi ? new Date(dto.tanggal_transaksi) : new Date(),
      metode_pembayaran: (dto.metode_pembayaran || 'Transfer').trim(),
      keterangan: (dto.keterangan || '-').trim(),
    };

    if (!payload.kode_peserta) {
      throw new BadRequestException('kode_peserta tidak boleh kosong');
    }
    if (!payload.nama_peserta) {
      throw new BadRequestException('nama_peserta tidak boleh kosong');
    }
    if (!payload.unit) {
      throw new BadRequestException('unit tidak boleh kosong');
    }
    if (!payload.kategori) {
      throw new BadRequestException('kategori tidak boleh kosong');
    }
    if (!payload.jumlah || payload.jumlah <= 0) {
      throw new BadRequestException('jumlah harus lebih dari 0');
    }

    const saved = await this.transaksiRepo.save(this.transaksiRepo.create(payload));
    return { status: 'success', data: saved };
  }

  async exportExcel(filter: LaporanFilterDto = {}): Promise<Buffer> {
    const report = await this.getReport(filter);
    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet('Laporan Akuntansi');
    sheet.addRow(['Laporan Akuntansi Sekolah Terpadu']);
    sheet.addRow([
      `Periode: ${filter.start || '-'} s/d ${filter.end || '-'} | Jenjang: ${filter.jenjang || 'Semua'}`,
    ]);
    sheet.addRow([]);

    sheet.addRow(['Total Pemasukan', report.ringkasan.total_pemasukan]);
    sheet.addRow(['Total Pengeluaran', report.ringkasan.total_pengeluaran]);
    sheet.addRow(['Saldo Akhir', report.ringkasan.saldo_akhir]);
    sheet.addRow([]);

    sheet.addRow([
      'ID',
      'Kode Peserta',
      'Nama',
      'Jenjang',
      'Unit',
      'Jenis',
      'Kategori',
      'Jumlah',
      'Metode',
      'Tanggal',
      'Keterangan',
    ]);

    for (const t of report.transaksi) {
      sheet.addRow([
        t.id,
        t.kode_peserta,
        t.nama_peserta,
        t.jenjang,
        t.unit,
        t.jenis_transaksi,
        t.kategori,
        Number(t.jumlah),
        t.metode_pembayaran,
        t.tanggal_transaksi.toISOString(),
        t.keterangan,
      ]);
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async exportPdf(filter: LaporanFilterDto = {}): Promise<Buffer> {
    const report = await this.getReport(filter);
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(14).text('Laporan Akuntansi Sekolah Terpadu', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Periode: ${filter.start || '-'} s/d ${filter.end || '-'} | Jenjang: ${filter.jenjang || 'Semua'}`);
      doc.moveDown(0.5);
      doc.text(`Total Pemasukan : ${report.ringkasan.total_pemasukan}`);
      doc.text(`Total Pengeluaran: ${report.ringkasan.total_pengeluaran}`);
      doc.text(`Saldo Akhir      : ${report.ringkasan.saldo_akhir}`);
      doc.moveDown();

      doc.fontSize(10).text('Daftar Transaksi:');
      doc.moveDown(0.4);

      for (const trx of report.transaksi.slice(0, 200)) {
        doc
          .fontSize(9)
          .text(
            `${trx.id}. ${trx.tanggal_transaksi.toISOString().slice(0, 10)} | ${trx.jenjang} | ${trx.nama_peserta} | ${trx.jenis_transaksi} | ${trx.kategori} | ${trx.jumlah}`,
          );
      }

      doc.end();
    });
  }

  private buildWhere(filter: LaporanFilterDto): FindOptionsWhere<TransaksiAkuntansiEntity> {
    const where: FindOptionsWhere<TransaksiAkuntansiEntity> = {};

    if (filter.jenjang) {
      where.jenjang = filter.jenjang;
    }

    if (filter.unit) {
      where.unit = filter.unit;
    }

    if (filter.start && filter.end) {
      where.tanggal_transaksi = Between(new Date(filter.start), new Date(filter.end));
    }

    return where;
  }

  private mapTransactionToJournal(trx: TransaksiAkuntansiEntity): JurnalEntry {
    const ref = `TRX-${trx.id}`;
    const tanggal = trx.tanggal_transaksi.toISOString().slice(0, 10);
    const deskripsi = `${trx.kategori} - ${trx.nama_peserta} (${trx.jenjang})`;
    const jumlah = Number(trx.jumlah);

    if (trx.jenis_transaksi === 'PEMASUKAN') {
      const akunPendapatan = this.resolvePendapatanAkun(trx.kategori);
      return {
        ref,
        tanggal,
        deskripsi,
        lines: [
          { akun_kode: '1110', akun_nama: 'Kas dan Bank', debit: jumlah, kredit: 0 },
          { akun_kode: akunPendapatan.kode, akun_nama: akunPendapatan.nama, debit: 0, kredit: jumlah },
        ],
      };
    }

    const akunBeban = this.resolveBebanAkun(trx.kategori);
    return {
      ref,
      tanggal,
      deskripsi,
      lines: [
        { akun_kode: akunBeban.kode, akun_nama: akunBeban.nama, debit: jumlah, kredit: 0 },
        { akun_kode: '1110', akun_nama: 'Kas dan Bank', debit: 0, kredit: jumlah },
      ],
    };
  }

  private resolvePendapatanAkun(kategori: string): { kode: string; nama: string } {
    const k = kategori.toLowerCase();
    if (k.includes('spp') || k.includes('ukt')) return { kode: '4110', nama: 'Pendapatan SPP/UKT' };
    if (k.includes('daftar ulang')) return { kode: '4120', nama: 'Pendapatan Daftar Ulang' };
    return { kode: '4130', nama: 'Pendapatan Lain Pendidikan' };
  }

  private resolveBebanAkun(kategori: string): { kode: string; nama: string } {
    const k = kategori.toLowerCase();
    if (k.includes('atk') || k.includes('laboratorium')) {
      return { kode: '5120', nama: 'Beban ATK dan Laboratorium' };
    }
    if (k.includes('kegiatan') || k.includes('akademik') || k.includes('praktik')) {
      return { kode: '5130', nama: 'Beban Kegiatan Akademik' };
    }
    return { kode: '5110', nama: 'Beban Operasional Pendidikan' };
  }

  private async seedData() {
    const sample: CreatePembayaranDto[] = [
      {
        kode_peserta: 'SD-001',
        nama_peserta: 'Alya Putri',
        jenjang: 'SD',
        unit: 'SD Al-Hikmah',
        jenis_transaksi: 'PEMASUKAN',
        kategori: 'SPP Bulanan',
        jumlah: 450000,
        metode_pembayaran: 'Transfer',
        keterangan: 'Pembayaran Juni',
      },
      {
        kode_peserta: 'SMP-007',
        nama_peserta: 'Bagas Rahman',
        jenjang: 'SMP',
        unit: 'SMP Al-Hikmah',
        jenis_transaksi: 'PEMASUKAN',
        kategori: 'Daftar Ulang',
        jumlah: 800000,
        metode_pembayaran: 'Virtual Account',
        keterangan: 'Semester Ganjil',
      },
      {
        kode_peserta: 'SMA-OPS-01',
        nama_peserta: 'Operasional Sekolah',
        jenjang: 'SMA',
        unit: 'SMA Al-Hikmah',
        jenis_transaksi: 'PENGELUARAN',
        kategori: 'ATK dan Laboratorium',
        jumlah: 550000,
        metode_pembayaran: 'Kas',
        keterangan: 'Kebutuhan praktikum',
      },
      {
        kode_peserta: 'SMK-022',
        nama_peserta: 'Citra Lestari',
        jenjang: 'SMK',
        unit: 'SMK Al-Hikmah',
        jenis_transaksi: 'PEMASUKAN',
        kategori: 'Uang Praktik Kejuruan',
        jumlah: 1200000,
        metode_pembayaran: 'Transfer',
        keterangan: 'Teknik Komputer',
      },
      {
        kode_peserta: 'UNI-114',
        nama_peserta: 'Dimas Fadli',
        jenjang: 'UNIVERSITAS',
        unit: 'Universitas Al-Hikmah',
        jenis_transaksi: 'PEMASUKAN',
        kategori: 'UKT',
        jumlah: 3500000,
        metode_pembayaran: 'Virtual Account',
        keterangan: 'Semester 3',
      },
    ];

    for (const dto of sample) {
      await this.create(dto);
    }
  }

  private async seedRkas() {
    const year = new Date().getFullYear();
    const sample: CreateRkasDto[] = [
      {
        tahun: year,
        jenjang: 'SD',
        unit: 'SD Al-Hikmah',
        kategori: 'SPP Bulanan',
        akun_kode: '4110',
        anggaran: 6000000,
      },
      {
        tahun: year,
        jenjang: 'SMP',
        unit: 'SMP Al-Hikmah',
        kategori: 'Daftar Ulang',
        akun_kode: '4120',
        anggaran: 2500000,
      },
      {
        tahun: year,
        jenjang: 'SMA',
        unit: 'SMA Al-Hikmah',
        kategori: 'ATK dan Laboratorium',
        akun_kode: '5120',
        anggaran: 2000000,
      },
      {
        tahun: year,
        jenjang: 'UNIVERSITAS',
        unit: 'Universitas Al-Hikmah',
        kategori: 'UKT',
        akun_kode: '4110',
        anggaran: 12000000,
      },
    ];

    for (const s of sample) {
      await this.createRkas(s);
    }
  }
}
