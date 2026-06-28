import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { JenjangPendidikan } from './transaksi-akuntansi.entity';

@Entity({ name: 'rkas_anggaran' })
export class RkasAnggaranEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  tahun!: number;

  @Column({ type: 'varchar', length: 20 })
  jenjang!: JenjangPendidikan;

  @Column({ length: 120 })
  unit!: string;

  @Column({ length: 120 })
  kategori!: string;

  @Column({ length: 20, default: '' })
  akun_kode!: string;

  @Column({ type: 'bigint' })
  anggaran!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
