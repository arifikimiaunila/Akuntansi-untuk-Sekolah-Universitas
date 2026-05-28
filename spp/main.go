package main

import (
	"spp/controllers"
	"spp/kafka"     // Sesuaikan dengan path module aplikasi Anda (misal: spp-app/kafka atau yourapp/kafka)
	_ "spp/routers" // jika Anda memakai router eksternal

	"github.com/beego/beego/v2/client/orm"
	beego "github.com/beego/beego/v2/server/web"
	_ "github.com/go-sql-driver/mysql"
)

// SendController ditaruh di sini jika belum dipisah ke folder controllers
type SendController struct {
	beego.Controller
}

func (c *SendController) Get() {
	msg := c.GetString("msg")
	err := kafka.SendMessage("test-topic", msg)
	if err != nil {
		c.Ctx.WriteString("Failed: " + err.Error())
	} else {
		c.Ctx.WriteString("Sent: " + msg)
	}
}

func init() {
	// Ambil konfigurasi dari app.conf
	dbUser, _ := beego.AppConfig.String("mysqluser")
	dbPass, _ := beego.AppConfig.String("mysqlpass")
	dbUrls, _ := beego.AppConfig.String("mysqlurls")
	dbName, _ := beego.AppConfig.String("mysqldb")

	// Set dataSource name
	dataSource := dbUser + ":" + dbPass + "@tcp(" + dbUrls + ":3306)/" + dbName + "?charset=utf8mb4&parseTime=True&loc=Local"

	// Daftarkan Driver dan database target
	orm.RegisterDriver("mysql", orm.DRMySQL)
	err := orm.RegisterDataBase("default", "mysql", dataSource)
	if err != nil {
		panic("Gagal mendaftarkan database: " + err.Error())
	}
}

func main() {
	// 1. Jalankan Kafka consumer asynchronous saat aplikasi start
	// Pastikan fungsi StartConsumer berjalan sebagai goroutine di dalam package kafka Anda
	// agar tidak mem-block proses beego.Run() di bawahnya.
	kafka.StartConsumer("test-topic")

	// 2. Mendaftarkan Route API Pembayaran SPP
	beego.Router("/api/pembayaran", &controllers.PembayaranController{}, "post:Post")

	// 3. Mendaftarkan Route API Producer Kafka
	beego.Router("/send", &SendController{})

	// 4. Jalankan server Beego
	beego.Run()
}