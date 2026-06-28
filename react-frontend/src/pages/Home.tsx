import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PembayaranForm from '../components/PembayaranForm';

interface TransaksiAkuntansi {
  id: number;
  kode_peserta: string;
  nama_peserta: string;
  jenjang: string;
  unit: string;
  jenis_transaksi: 'PEMASUKAN' | 'PENGELUARAN';
  kategori: string;
  jumlah: number;
  tanggal_transaksi: string;
  metode_pembayaran: string;
  keterangan: string;
}

interface RingkasanJenjang {
  jenjang: string;
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
}

interface RingkasanAkuntansi {
  total_pemasukan: number;
  total_pengeluaran: number;
  saldo_akhir: number;
  per_jenjang: RingkasanJenjang[];
}

interface LoginResponse {
  token: string;
  profile: {
    username: string;
    nama: string;
    role: string;
  };
  expires_in: string;
}

interface CoaAkun {
  kode: string;
  nama: string;
  kelompok: string;
  saldo_normal: string;
}

interface NeracaSaldoRow {
  akun_kode: string;
  akun_nama: string;
  debit: number;
  kredit: number;
}

interface BukuBesarAkun {
  akun_kode: string;
  akun_nama: string;
  saldo_normal: string;
  total_debit: number;
  total_kredit: number;
  saldo_akhir: number;
}

interface LabaRugiRow {
  jenjang: string;
  unit: string;
  pendapatan: number;
  beban: number;
  surplus_defisit: number;
}

interface LabaRugiReport {
  total_pendapatan: number;
  total_beban: number;
  surplus_defisit: number;
  per_unit: LabaRugiRow[];
}

interface NeracaPosRow {
  akun_kode: string;
  akun_nama: string;
  nilai: number;
}

interface NeracaPendidikan {
  aset: NeracaPosRow[];
  liabilitas: NeracaPosRow[];
  aset_neto: NeracaPosRow[];
  total_aset: number;
  total_liabilitas: number;
  total_aset_neto: number;
}

interface PerubahanAsetNeto {
  saldo_awal: number;
  surplus_defisit_periode: number;
  saldo_akhir: number;
  periode: { start?: string; end?: string };
}

interface RkasRow {
  id: number;
  tahun: number;
  jenjang: string;
  unit: string;
  kategori: string;
  akun_kode: string;
  anggaran: number;
}

interface RkasVsRealisasiRow {
  tahun: number;
  jenjang: string;
  unit: string;
  kategori: string;
  akun_kode: string;
  anggaran: number;
  realisasi: number;
  selisih: number;
  persentase_realisasi: number;
}

interface RkasVsRealisasiReport {
  tahun: number;
  total_anggaran: number;
  total_realisasi: number;
  total_selisih: number;
  rows: RkasVsRealisasiRow[];
}

export default function Home() {
  const [items, setItems] = useState<TransaksiAkuntansi[]>([]);
  const [coa, setCoa] = useState<CoaAkun[]>([]);
  const [neracaSaldo, setNeracaSaldo] = useState<NeracaSaldoRow[]>([]);
  const [bukuBesar, setBukuBesar] = useState<BukuBesarAkun[]>([]);
  const [labaRugi, setLabaRugi] = useState<LabaRugiReport>({
    total_pendapatan: 0,
    total_beban: 0,
    surplus_defisit: 0,
    per_unit: [],
  });
  const [neraca, setNeraca] = useState<NeracaPendidikan>({
    aset: [],
    liabilitas: [],
    aset_neto: [],
    total_aset: 0,
    total_liabilitas: 0,
    total_aset_neto: 0,
  });
  const [perubahanAsetNeto, setPerubahanAsetNeto] = useState<PerubahanAsetNeto>({
    saldo_awal: 0,
    surplus_defisit_periode: 0,
    saldo_akhir: 0,
    periode: {},
  });
  const [rkas, setRkas] = useState<RkasRow[]>([]);
  const [rkasVsRealisasi, setRkasVsRealisasi] = useState<RkasVsRealisasiReport>({
    tahun: new Date().getFullYear(),
    total_anggaran: 0,
    total_realisasi: 0,
    total_selisih: 0,
    rows: [],
  });

  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [profile, setProfile] = useState<{ nama: string; role: string } | null>(() => {
    const raw = localStorage.getItem('profile');
    return raw ? JSON.parse(raw) : null;
  });
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [authError, setAuthError] = useState('');

  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');
  const [reportJenjang, setReportJenjang] = useState('');
  const [reportUnit, setReportUnit] = useState('');
  const [reportYear, setReportYear] = useState(String(new Date().getFullYear()));

  const [summary, setSummary] = useState<RingkasanAkuntansi>({
    total_pemasukan: 0,
    total_pengeluaran: 0,
    saldo_akhir: 0,
    per_jenjang: [],
  });

  const [rkasForm, setRkasForm] = useState({
    tahun: String(new Date().getFullYear()),
    jenjang: 'SD',
    unit: 'SD Al-Hikmah',
    kategori: 'SPP Bulanan',
    akun_kode: '4110',
    anggaran: 0,
  });
  const [rkasMessage, setRkasMessage] = useState('');

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);

  const requestConfig = () => ({ headers: { Authorization: `Bearer ${token}` } });

  const reportParams = () => ({
    start: reportStart || undefined,
    end: reportEnd || undefined,
    jenjang: reportJenjang || undefined,
    unit: reportUnit || undefined,
  });

  const loadData = async () => {
    if (!token) return;

    const [
      listResp,
      summaryResp,
      coaResp,
      neracaResp,
      ledgerResp,
      labaRugiResp,
      neracaPosisiResp,
      perubahanResp,
      rkasResp,
      rkasVsResp,
    ] = await Promise.all([
      axios.get('/api/pembayaran', { ...requestConfig(), params: reportParams() }),
      axios.get('/api/pembayaran/ringkasan', { ...requestConfig(), params: reportParams() }),
      axios.get('/api/pembayaran/akuntansi/coa', requestConfig()),
      axios.get('/api/pembayaran/akuntansi/neraca-saldo', { ...requestConfig(), params: reportParams() }),
      axios.get('/api/pembayaran/akuntansi/buku-besar', { ...requestConfig(), params: reportParams() }),
      axios.get('/api/pembayaran/akuntansi/laba-rugi', { ...requestConfig(), params: reportParams() }),
      axios.get('/api/pembayaran/akuntansi/neraca', { ...requestConfig(), params: reportParams() }),
      axios.get('/api/pembayaran/akuntansi/perubahan-aset-neto', { ...requestConfig(), params: reportParams() }),
      axios.get('/api/pembayaran/akuntansi/rkas', {
        ...requestConfig(),
        params: { tahun: Number(reportYear), jenjang: reportJenjang || undefined, unit: reportUnit || undefined },
      }),
      axios.get('/api/pembayaran/akuntansi/rkas-vs-realisasi', {
        ...requestConfig(),
        params: { tahun: Number(reportYear), jenjang: reportJenjang || undefined, unit: reportUnit || undefined },
      }),
    ]);

    setItems(listResp.data || []);
    setSummary(summaryResp.data || summary);
    setCoa(coaResp.data || []);
    setNeracaSaldo(neracaResp.data || []);
    setBukuBesar(ledgerResp.data || []);
    setLabaRugi(labaRugiResp.data || labaRugi);
    setNeraca(neracaPosisiResp.data || neraca);
    setPerubahanAsetNeto(perubahanResp.data || perubahanAsetNeto);
    setRkas(rkasResp.data || []);
    setRkasVsRealisasi(rkasVsResp.data || rkasVsRealisasi);
  };

  useEffect(() => {
    loadData();
  }, [token, reportStart, reportEnd, reportJenjang, reportUnit, reportYear]);

  const onSaved = (item: unknown) => {
    setItems((old) => [item as TransaksiAkuntansi, ...old]);
    loadData();
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const resp = await axios.post<LoginResponse>('/api/auth/login', { username, password });
      setToken(resp.data.token);
      setProfile(resp.data.profile);
      localStorage.setItem('token', resp.data.token);
      localStorage.setItem('profile', JSON.stringify(resp.data.profile));
    } catch (err: any) {
      setAuthError(err?.response?.data?.message || 'Login gagal');
    }
  };

  const logout = () => {
    setToken('');
    setProfile(null);
    localStorage.removeItem('token');
    localStorage.removeItem('profile');
    setItems([]);
  };

  const exportFile = async (format: 'excel' | 'pdf') => {
    const ext = format === 'excel' ? 'xlsx' : 'pdf';
    const mime =
      format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';

    const resp = await axios.get(`/api/pembayaran/laporan/export/${format}`, {
      ...requestConfig(),
      params: reportParams(),
      responseType: 'blob',
    });

    const blob = new Blob([resp.data], { type: mime });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-akuntansi-${Date.now()}.${ext}`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const canEditRkas = profile?.role === 'ADMIN_YAYASAN' || profile?.role === 'BENDAHARA_UNIT';

  const saveRkas = async (e: React.FormEvent) => {
    e.preventDefault();
    setRkasMessage('');
    if (!canEditRkas) return;
    try {
      await axios.post(
        '/api/pembayaran/akuntansi/rkas',
        {
          tahun: Number(rkasForm.tahun),
          jenjang: rkasForm.jenjang,
          unit: rkasForm.unit,
          kategori: rkasForm.kategori,
          akun_kode: rkasForm.akun_kode,
          anggaran: Number(rkasForm.anggaran),
        },
        requestConfig(),
      );
      setRkasMessage('Anggaran RKAS berhasil disimpan');
      loadData();
    } catch (err: any) {
      setRkasMessage(err?.response?.data?.message || 'Gagal menyimpan RKAS');
    }
  };

  const badgeClass = (jenis: 'PEMASUKAN' | 'PENGELUARAN') =>
    jenis === 'PEMASUKAN' ? 'badge badge-in' : 'badge badge-out';

  const saldoClass = (saldo: number) => (saldo >= 0 ? 'saldo-positive' : 'saldo-negative');

  const updatedAt = new Date().toLocaleString('id-ID');

  return (
    <div className="page-wrap">
      <header className="hero">
        <h1>Akuntansi Dunia Pendidikan Terpadu</h1>
        <p>
          Sistem keuangan dari pendidikan dasar/sederhana sampai universitas: transaksi, jurnal, buku besar,
          laba rugi, neraca, perubahan aset neto, dan RKAS vs realisasi.
        </p>
        <small>Terakhir diperbarui: {updatedAt}</small>
      </header>

      {!token ? (
        <section className="card auth-box">
          <h2>Login Sistem</h2>
          <p className="muted">Akun demo: admin/admin123, bendahara/bendahara123, operator/operator123</p>
          <form onSubmit={login} className="auth-grid">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button type="submit">Login</button>
          </form>
          {authError && <p className="error-text">{authError}</p>}
        </section>
      ) : (
        <section className="card top-controls">
          <div>
            <strong>{profile?.nama}</strong>
            <p className="muted">Role: {profile?.role}</p>
          </div>
          <div className="filter-grid">
            <input type="date" value={reportStart} onChange={(e) => setReportStart(e.target.value)} />
            <input type="date" value={reportEnd} onChange={(e) => setReportEnd(e.target.value)} />
            <input
              type="number"
              min={2000}
              value={reportYear}
              onChange={(e) => setReportYear(e.target.value)}
              placeholder="Tahun RKAS"
            />
            <select value={reportJenjang} onChange={(e) => setReportJenjang(e.target.value)}>
              <option value="">Semua Jenjang</option>
              <option value="PAUD">PAUD</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="SMK">SMK</option>
              <option value="UNIVERSITAS">Universitas</option>
            </select>
            <input
              value={reportUnit}
              onChange={(e) => setReportUnit(e.target.value)}
              placeholder="Filter unit (opsional)"
            />
            <button type="button" onClick={() => exportFile('excel')}>Export Excel</button>
            <button type="button" onClick={() => exportFile('pdf')}>Export PDF</button>
            <button type="button" onClick={logout}>Logout</button>
          </div>
        </section>
      )}

      {!token ? null : (
        <>
          <section className="summary-grid">
            <article className="card metric-card in">
              <h3>Total Pemasukan</h3>
              <p>{formatRupiah(summary.total_pemasukan)}</p>
            </article>
            <article className="card metric-card out">
              <h3>Total Pengeluaran</h3>
              <p>{formatRupiah(summary.total_pengeluaran)}</p>
            </article>
            <article className="card metric-card saldo">
              <h3>Saldo Akhir</h3>
              <p className={saldoClass(summary.saldo_akhir)}>{formatRupiah(summary.saldo_akhir)}</p>
            </article>
          </section>

          <PembayaranForm token={token} onSaved={onSaved} />

          <section className="card">
            <h2>Ringkasan Per Jenjang</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Jenjang</th>
                    <th>Pemasukan</th>
                    <th>Pengeluaran</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.per_jenjang.map((row) => (
                    <tr key={row.jenjang}>
                      <td>{row.jenjang}</td>
                      <td>{formatRupiah(row.pemasukan)}</td>
                      <td>{formatRupiah(row.pengeluaran)}</td>
                      <td className={saldoClass(row.saldo)}>{formatRupiah(row.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2>Daftar Transaksi</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama</th>
                    <th>Jenjang</th>
                    <th>Kategori</th>
                    <th>Jenis</th>
                    <th>Jumlah</th>
                    <th>Metode</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.kode_peserta}</td>
                      <td>{it.nama_peserta}</td>
                      <td>{it.jenjang}</td>
                      <td>{it.kategori}</td>
                      <td>
                        <span className={badgeClass(it.jenis_transaksi)}>{it.jenis_transaksi}</span>
                      </td>
                      <td>{formatRupiah(it.jumlah)}</td>
                      <td>{it.metode_pembayaran}</td>
                      <td>{new Date(it.tanggal_transaksi).toLocaleDateString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2>Chart of Accounts (COA) Pendidikan</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kode Akun</th>
                    <th>Nama Akun</th>
                    <th>Kelompok</th>
                    <th>Saldo Normal</th>
                  </tr>
                </thead>
                <tbody>
                  {coa.map((a) => (
                    <tr key={a.kode}>
                      <td>{a.kode}</td>
                      <td>{a.nama}</td>
                      <td>{a.kelompok}</td>
                      <td>{a.saldo_normal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2>Neraca Saldo</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kode Akun</th>
                    <th>Nama Akun</th>
                    <th>Debit</th>
                    <th>Kredit</th>
                  </tr>
                </thead>
                <tbody>
                  {neracaSaldo.map((n) => (
                    <tr key={n.akun_kode}>
                      <td>{n.akun_kode}</td>
                      <td>{n.akun_nama}</td>
                      <td>{formatRupiah(n.debit)}</td>
                      <td>{formatRupiah(n.kredit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2>Ringkasan Buku Besar</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kode Akun</th>
                    <th>Nama Akun</th>
                    <th>Total Debit</th>
                    <th>Total Kredit</th>
                    <th>Saldo Akhir</th>
                  </tr>
                </thead>
                <tbody>
                  {bukuBesar.map((b) => (
                    <tr key={b.akun_kode}>
                      <td>{b.akun_kode}</td>
                      <td>{b.akun_nama}</td>
                      <td>{formatRupiah(b.total_debit)}</td>
                      <td>{formatRupiah(b.total_kredit)}</td>
                      <td className={saldoClass(b.saldo_akhir)}>{formatRupiah(b.saldo_akhir)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2>Laba Rugi Per Jenjang dan Unit</h2>
            <p className="muted">
              Pendapatan: {formatRupiah(labaRugi.total_pendapatan)} | Beban: {formatRupiah(labaRugi.total_beban)} |
              Surplus/Defisit: {formatRupiah(labaRugi.surplus_defisit)}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Jenjang</th>
                    <th>Unit</th>
                    <th>Pendapatan</th>
                    <th>Beban</th>
                    <th>Surplus/Defisit</th>
                  </tr>
                </thead>
                <tbody>
                  {labaRugi.per_unit.map((r, idx) => (
                    <tr key={`${r.jenjang}-${r.unit}-${idx}`}>
                      <td>{r.jenjang}</td>
                      <td>{r.unit}</td>
                      <td>{formatRupiah(r.pendapatan)}</td>
                      <td>{formatRupiah(r.beban)}</td>
                      <td className={saldoClass(r.surplus_defisit)}>{formatRupiah(r.surplus_defisit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card">
            <h2>Neraca dan Perubahan Aset Neto</h2>
            <p className="muted">
              Total Aset: {formatRupiah(neraca.total_aset)} | Total Liabilitas: {formatRupiah(neraca.total_liabilitas)} |
              Total Aset Neto: {formatRupiah(neraca.total_aset_neto)}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Kelompok</th>
                    <th>Kode Akun</th>
                    <th>Nama Akun</th>
                    <th>Nilai</th>
                  </tr>
                </thead>
                <tbody>
                  {neraca.aset.map((a) => (
                    <tr key={`aset-${a.akun_kode}`}>
                      <td>ASET</td>
                      <td>{a.akun_kode}</td>
                      <td>{a.akun_nama}</td>
                      <td>{formatRupiah(a.nilai)}</td>
                    </tr>
                  ))}
                  {neraca.liabilitas.map((a) => (
                    <tr key={`liabilitas-${a.akun_kode}`}>
                      <td>LIABILITAS</td>
                      <td>{a.akun_kode}</td>
                      <td>{a.akun_nama}</td>
                      <td>{formatRupiah(a.nilai)}</td>
                    </tr>
                  ))}
                  {neraca.aset_neto.map((a) => (
                    <tr key={`neto-${a.akun_kode}`}>
                      <td>ASET NETO</td>
                      <td>{a.akun_kode}</td>
                      <td>{a.akun_nama}</td>
                      <td>{formatRupiah(a.nilai)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">
              Saldo Awal: {formatRupiah(perubahanAsetNeto.saldo_awal)} | Surplus/Defisit Periode:{' '}
              {formatRupiah(perubahanAsetNeto.surplus_defisit_periode)} | Saldo Akhir:{' '}
              {formatRupiah(perubahanAsetNeto.saldo_akhir)}
            </p>
          </section>

          <section className="card">
            <h2>RKAS vs Realisasi</h2>
            {canEditRkas && (
              <form onSubmit={saveRkas} className="form-grid rkas-grid">
                <input
                  type="number"
                  min={2000}
                  value={rkasForm.tahun}
                  onChange={(e) => setRkasForm((s) => ({ ...s, tahun: e.target.value }))}
                  placeholder="Tahun"
                />
                <select
                  value={rkasForm.jenjang}
                  onChange={(e) => setRkasForm((s) => ({ ...s, jenjang: e.target.value }))}
                >
                  <option value="PAUD">PAUD</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                  <option value="UNIVERSITAS">Universitas</option>
                </select>
                <input
                  value={rkasForm.unit}
                  onChange={(e) => setRkasForm((s) => ({ ...s, unit: e.target.value }))}
                  placeholder="Unit"
                />
                <input
                  value={rkasForm.kategori}
                  onChange={(e) => setRkasForm((s) => ({ ...s, kategori: e.target.value }))}
                  placeholder="Kategori"
                />
                <input
                  value={rkasForm.akun_kode}
                  onChange={(e) => setRkasForm((s) => ({ ...s, akun_kode: e.target.value }))}
                  placeholder="Kode Akun"
                />
                <input
                  type="number"
                  min={0}
                  value={rkasForm.anggaran}
                  onChange={(e) => setRkasForm((s) => ({ ...s, anggaran: Number(e.target.value) }))}
                  placeholder="Anggaran"
                />
                <button type="submit">Simpan RKAS</button>
              </form>
            )}
            {rkasMessage && <p className="muted">{rkasMessage}</p>}
            <p className="muted">
              Total Anggaran: {formatRupiah(rkasVsRealisasi.total_anggaran)} | Total Realisasi:{' '}
              {formatRupiah(rkasVsRealisasi.total_realisasi)} | Selisih:{' '}
              {formatRupiah(rkasVsRealisasi.total_selisih)}
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tahun</th>
                    <th>Jenjang</th>
                    <th>Unit</th>
                    <th>Kategori</th>
                    <th>Kode Akun</th>
                    <th>Anggaran</th>
                    <th>Realisasi</th>
                    <th>Selisih</th>
                    <th>% Realisasi</th>
                  </tr>
                </thead>
                <tbody>
                  {rkasVsRealisasi.rows.map((r, idx) => (
                    <tr key={`${r.tahun}-${r.jenjang}-${r.unit}-${r.kategori}-${idx}`}>
                      <td>{r.tahun}</td>
                      <td>{r.jenjang}</td>
                      <td>{r.unit}</td>
                      <td>{r.kategori}</td>
                      <td>{r.akun_kode || '-'}</td>
                      <td>{formatRupiah(r.anggaran)}</td>
                      <td>{formatRupiah(r.realisasi)}</td>
                      <td className={saldoClass(r.selisih)}>{formatRupiah(r.selisih)}</td>
                      <td>{r.persentase_realisasi}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Data RKAS Tersimpan</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tahun</th>
                    <th>Jenjang</th>
                    <th>Unit</th>
                    <th>Kategori</th>
                    <th>Kode Akun</th>
                    <th>Anggaran</th>
                  </tr>
                </thead>
                <tbody>
                  {rkas.map((r) => (
                    <tr key={r.id}>
                      <td>{r.tahun}</td>
                      <td>{r.jenjang}</td>
                      <td>{r.unit}</td>
                      <td>{r.kategori}</td>
                      <td>{r.akun_kode || '-'}</td>
                      <td>{formatRupiah(r.anggaran)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
