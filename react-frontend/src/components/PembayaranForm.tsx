import React, { useState } from 'react';
import axios from 'axios';

type JenjangPendidikan = 'PAUD' | 'SD' | 'SMP' | 'SMA' | 'SMK' | 'UNIVERSITAS';
type JenisTransaksi = 'PEMASUKAN' | 'PENGELUARAN';

export interface TransaksiForm {
  kode_peserta: string;
  nama_peserta: string;
  jenjang: JenjangPendidikan;
  unit: string;
  jenis_transaksi: JenisTransaksi;
  kategori: string;
  jumlah: number;
  metode_pembayaran: string;
  keterangan: string;
}

const initialForm: TransaksiForm = {
  kode_peserta: '',
  nama_peserta: '',
  jenjang: 'SD',
  unit: 'SD Al-Hikmah',
  jenis_transaksi: 'PEMASUKAN',
  kategori: 'SPP Bulanan',
  jumlah: 0,
  metode_pembayaran: 'Transfer',
  keterangan: '',
};

export default function PembayaranForm({
  token,
  onSaved,
}: {
  token: string;
  onSaved?: (item: unknown) => void;
}) {
  const [form, setForm] = useState<TransaksiForm>(initialForm);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const resp = await axios.post('/api/pembayaran', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.data?.error) {
        setError(resp.data.error);
        return;
      }
      if (resp.data?.data) {
        onSaved?.(resp.data.data);
        setForm(initialForm);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menyimpan transaksi');
    }
  };

  const update = <K extends keyof TransaksiForm>(key: K, value: TransaksiForm[K]) => {
    setForm((old) => ({ ...old, [key]: value }));
  };

  return (
    <form onSubmit={submit} className="card transaksi-form">
      <h2>Input Transaksi</h2>
      <p className="muted">Kelola pemasukan dan pengeluaran untuk semua jenjang pendidikan.</p>

      <div className="form-grid">
        <div>
          <label>Kode Peserta</label>
          <input value={form.kode_peserta} onChange={(e) => update('kode_peserta', e.target.value)} />
        </div>
        <div>
          <label>Nama Peserta</label>
          <input value={form.nama_peserta} onChange={(e) => update('nama_peserta', e.target.value)} />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label>Jenjang</label>
          <select
            value={form.jenjang}
            onChange={(e) => update('jenjang', e.target.value as JenjangPendidikan)}
          >
            <option value="PAUD">PAUD</option>
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA</option>
            <option value="SMK">SMK</option>
            <option value="UNIVERSITAS">Universitas</option>
          </select>
        </div>
        <div>
          <label>Unit</label>
          <input value={form.unit} onChange={(e) => update('unit', e.target.value)} />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label>Jenis Transaksi</label>
          <select
            value={form.jenis_transaksi}
            onChange={(e) => update('jenis_transaksi', e.target.value as JenisTransaksi)}
          >
            <option value="PEMASUKAN">Pemasukan</option>
            <option value="PENGELUARAN">Pengeluaran</option>
          </select>
        </div>
        <div>
          <label>Kategori</label>
          <input value={form.kategori} onChange={(e) => update('kategori', e.target.value)} />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label>Jumlah</label>
          <input
            type="number"
            min={0}
            value={form.jumlah}
            onChange={(e) => update('jumlah', Number(e.target.value))}
          />
        </div>
        <div>
          <label>Metode Pembayaran</label>
          <input
            value={form.metode_pembayaran}
            onChange={(e) => update('metode_pembayaran', e.target.value)}
          />
        </div>
      </div>

      <div>
        <label>Keterangan</label>
        <input value={form.keterangan} onChange={(e) => update('keterangan', e.target.value)} />
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" disabled={!token}>Simpan Transaksi</button>
    </form>
  );
}
