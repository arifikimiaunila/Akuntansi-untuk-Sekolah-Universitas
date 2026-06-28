import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type JenjangPendidikan = 'PAUD' | 'SD' | 'SMP' | 'SMA' | 'SMK' | 'UNIVERSITAS';
export type JenisTransaksi = 'PEMASUKAN' | 'PENGELUARAN';

@Entity({ name: 'transaksi_akuntansi' })
export class TransaksiAkuntansiEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 50 })
  kode_peserta!: string;

  @Column({ length: 120 })
  nama_peserta!: string;

  @Column({ length: 20 })
  jenjang!: JenjangPendidikan;

  @Column({ length: 120 })
  unit!: string;

  @Column({ length: 20 })
  jenis_transaksi!: JenisTransaksi;

  @Column({ length: 120 })
  kategori!: string;

  @Column({ type: 'bigint' })
  jumlah!: number;

  @Column({ type: 'timestamptz' })
  tanggal_transaksi!: Date;

  @Column({ length: 80 })
  metode_pembayaran!: string;

  @Column({ type: 'text', default: '-' })
  keterangan!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
