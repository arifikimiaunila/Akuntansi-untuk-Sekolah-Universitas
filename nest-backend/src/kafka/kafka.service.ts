import { Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaService {
  private kafka: Kafka;
  constructor() {
    this.kafka = new Kafka({ brokers: ['localhost:9092'] });
  }

  async send(topic: string, message: string) {
    const producer = this.kafka.producer();
    await producer.connect();
    await producer.send({ topic, messages: [{ value: message }] });
    await producer.disconnect();
  }

  // consumer helper - non-blocking starter
  async startConsumer(topic: string, groupId = 'nest-group') {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });
    consumer.run({
      eachMessage: async ({ message }) => {
        console.log('Received:', message.value?.toString());
      },
    });
  }
}
