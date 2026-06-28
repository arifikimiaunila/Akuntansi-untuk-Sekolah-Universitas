package kafka

import (
    "context"
    "github.com/segmentio/kafka-go"
)

func SendMessage(topic, message string) error {
    writer := kafka.NewWriter(kafka.WriterConfig{
        Brokers: []string{"localhost:9092"},
        Topic:   topic,
    })
    defer writer.Close()

    return writer.WriteMessages(context.Background(),
        kafka.Message{
            Value: []byte(message),
        },
    )
}
