# Akuntansi Sekolah Terpadu

Proyek ini sekarang mencakup:

- Backend NestJS: API akuntansi sekolah dengan autentikasi JWT + role-based access.
- Frontend React: dashboard transaksi, ringkasan jenjang, filter periode, export laporan.
- Proyek Go lama tetap ada di folder `spp/` sebagai referensi.

## Fitur Utama

- Manajemen transaksi pemasukan/pengeluaran lintas jenjang: PAUD, SD, SMP, SMA, SMK, Universitas.
- Login role-based:
	- `ADMIN_YAYASAN`
	- `BENDAHARA_UNIT`
	- `OPERATOR_KAMPUS`
- Laporan periode + filter jenjang.
- Export laporan ke Excel dan PDF.
- Penyimpanan data ke PostgreSQL via TypeORM.
- Akuntansi pendidikan lanjutan:
	- Laba Rugi per jenjang dan unit
	- Neraca + Perubahan Aset Neto
	- RKAS vs Realisasi

## Akun Demo

- `admin / admin123`
- `bendahara / bendahara123`
- `operator / operator123`

## Menjalankan Backend (NestJS)

1. Masuk ke folder `nest-backend`.
2. Salin `.env.example` menjadi `.env` (opsional, jika ingin custom konfigurasi DB/JWT).
3. Jalankan:

```bash
npm install
npm run start:dev
```

Backend berjalan di `http://localhost:3000` dengan prefix API ` /api`.

## Menjalankan Frontend (React)

1. Masuk ke folder `react-frontend`.
2. Jalankan:

```bash
npm install
npm run dev
```

## Endpoint Penting

- `POST /api/auth/login`
- `GET /api/pembayaran`
- `GET /api/pembayaran/ringkasan`
- `GET /api/pembayaran/laporan`
- `GET /api/pembayaran/laporan/export/excel`
- `GET /api/pembayaran/laporan/export/pdf`
- `GET /api/pembayaran/akuntansi/laba-rugi`
- `GET /api/pembayaran/akuntansi/neraca`
- `GET /api/pembayaran/akuntansi/perubahan-aset-neto`
- `POST /api/pembayaran/akuntansi/rkas`
- `GET /api/pembayaran/akuntansi/rkas`
- `GET /api/pembayaran/akuntansi/rkas-vs-realisasi?tahun=2026`
