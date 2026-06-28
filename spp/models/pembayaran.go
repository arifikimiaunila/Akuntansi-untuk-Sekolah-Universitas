package models

import (
	"errors"
	"strings"
	"time"

	"github.com/beego/beego/v2/client/orm"
)

// PembayaranSpp merepresentasikan struktur tabel di database
type PembayaranSpp struct {
	Id_pembayaran int       `orm:"auto;pk;column(id_pembayaran)" json:"id_pembayaran"`
	Nis           string    `orm:"size(20);column(nis)" json:"nis"`
	JumlahSpp     float64   `orm:"column(jumlah_spp)" json:"jumlah_spp"`
	TglPembayaran time.Time `orm:"type(date);column(tgl_pembayaran)" json:"tgl_pembayaran"`
	Keterangan    string    `orm:"size(255);column(keterangan)" json:"keterangan"`
}

// TableName menentukan nama tabel custom di Beego ORM
func (t *PembayaranSpp) TableName() string {
	return "pembayaran_spp"
}

func init() {
	// Register model ke Beego ORM
	orm.RegisterModel(new(PembayaranSpp))
}

// SanitizeAndValidate melakukan filtering ketat anti-NULL dan validasi tipe data
func (p *PembayaranSpp) SanitizeAndValidate() error {
	// 1. Sanitasi String (Trim spaces & pastikan tidak kosong)
	p.Nis = strings.TrimSpace(p.Nis)
	p.Keterangan = strings.TrimSpace(p.Keterangan)

	if p.Nis == "" {
		return errors.New("nis tidak boleh kosong atau hanya berisi spasi")
	}

	// Jika keterangan kosong, berikan string kosong bawaan (bukan NULL)
	if p.Keterangan == "" {
		p.Keterangan = "-"
	}

	// 2. Validasi & Sanitasi Data Numerik
	if p.JumlahSpp < 0 {
		return errors.New("jumlah_spp tidak boleh minus")
	}
	// Nilai default jika 0 (tetap aman dari NULL karena tipe primitif float64 di Go default-nya 0)

	// 3. Validasi & Sanitasi Tanggal
	// Jika tanggal belum di-set atau bernilai zero-value Go, berikan tanggal default aman
	if p.TglPembayaran.IsZero() {
		p.TglPembayaran = time.Date(1970, 1, 1, 0, 0, 0, 0, time.UTC)
	}

	return nil
}

// InsertPembayaran menambahkan data setelah lolos filter sanitasi
func InsertPembayaran(p *PembayaranSpp) (int64, error) {
	o := orm.NewOrm()

	// Jalankan fungsi filter & sanitasi sebelum query ke DB
	if err := p.SanitizeAndValidate(); err != nil {
		return 0, err
	}

	id, err := o.Insert(p)
	return id, err
}
