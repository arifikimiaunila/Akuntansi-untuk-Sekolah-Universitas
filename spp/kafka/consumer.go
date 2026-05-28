package kafka

import (
    "context"
    "fmt"
    "github.com/segmentio/kafka-go"
)

func StartConsumer(topic string) {
    reader := kafka.NewReader(kafka.ReaderConfig{
        Brokers: []string{"localhost:9092"},
        GroupID: "beego-group",
        Topic:   topic,
    })

    go func() {
        for {
            msg, err := reader.ReadMessage(context.Background())
            if err != nil {
                fmt.Println("Error:", err)
                continue
            }
            fmt.Printf("Received: %s\n", string(msg.Value))
            // Bisa dipanggil ke service Beego, misalnya simpan ke DB
        }
    }()
}
