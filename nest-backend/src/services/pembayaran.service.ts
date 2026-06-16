export interface PembayaranSpp {
  id: number;
  nis: string;
  jumlah_spp: number;
  tgl_pembayaran: string; // ISO date
  keterangan: string;
}

export class CreatePembayaranDto {
  nis: string;
  jumlah_spp: number;
  tgl_pembayaran?: string;
  keterangan?: string;
}

export class PembayaranService {
  private items: PembayaranSpp[] = [];
  private sequence = 1;

  findAll(): PembayaranSpp[] {
    return this.items;
  }

  create(dto: CreatePembayaranDto) {
    const now = dto.tgl_pembayaran || new Date(0).toISOString();
    const item: PembayaranSpp = {
      id: this.sequence++,
      nis: (dto.nis || '').trim(),
      jumlah_spp: dto.jumlah_spp || 0,
      tgl_pembayaran: now,
      keterangan: (dto.keterangan || '-').trim(),
    };

    // basic validation
    if (!item.nis) {
      return { error: 'nis tidak boleh kosong' };
    }
    if (item.jumlah_spp < 0) {
      return { error: 'jumlah_spp tidak boleh minus' };
    }

    this.items.push(item);
    return { status: 'success', data: item };
  }
}
