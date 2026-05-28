package controllers

import (
	"encoding/json"
	"spp/models"
	"time"

	beego "github.com/beego/beego/v2/server/web"
)

type PembayaranController struct {
	beego.Controller
}

// RequestInput digunakan untuk menangkap raw data dari client sebelum dikonversi
type RequestInput struct {
	Nis           string  `json:"nis"`
	JumlahSpp     float64 `json:"jumlah_spp"`
	TglPembayaran string  `json:"tgl_pembayaran"` // Ditangkap sebagai string untuk divalidasi manual
	Keterangan    string  `json:"keterangan"`
}

// Post handles /pembayaran (Create Data)
func (c *PembayaranController) Post() {
	var input RequestInput

	// Parsing Request Body JSON
	if err := json.Unmarshal(c.Ctx.Input.RequestBody, &input); err != nil {
		c.Data["json"] = map[string]string{"error": "Format JSON atau Tipe Data tidak valid"}
		c.ServeJSON()
		return
	}

	// Konversi format tanggal string ke time.Time secara aman
	var tgl time.Time
	var err error
	if input.TglPembayaran != "" {
		// Ekspektasi format tanggal: YYYY-MM-DD
		tgl, err = time.Parse("2006-01-02", input.TglPembayaran)
		if err != nil {
			c.Data["json"] = map[string]string{"error": "Format tgl_pembayaran salah. Gunakan YYYY-MM-DD"}
			c.ServeJSON()
			return
		}
	}

	// Pindahkan data input ke objek Model
	pembayaran := models.PembayaranSpp{
		Nis:           input.Nis,
		JumlahSpp:     input.JumlahSpp,
		TglPembayaran: tgl,
		Keterangan:    input.Keterangan,
	}

	// Simpan via model yang sudah ter-sanitasi di dalam logic-nya
	id, err := models.InsertPembayaran(&pembayaran)
	if err != nil {
		c.Data["json"] = map[string]string{"error": err.Error()}
		c.ServeJSON()
		return
	}

	pembayaran.Id_pembayaran = int(id)
	c.Data["json"] = map[string]interface{}{
		"status":  "success",
		"message": "Data berhasil disimpan tanpa ada nilai NULL",
		"data":    pembayaran,
	}
	c.ServeJSON()
}
