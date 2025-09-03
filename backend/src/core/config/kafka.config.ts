import { registerAs } from '@nestjs/config';

export default registerAs('kafka', () => {
  const config = {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    clientId: process.env.KAFKA_CLIENT_ID || 'study-tool-backend',
    groupId: process.env.KAFKA_GROUP_ID || 'study-tool-group',
    connectionTimeout: parseInt(
      process.env.KAFKA_CONNECTION_TIMEOUT || '3000',
      10,
    ),
    retries: parseInt(process.env.KAFKA_RETRIES || '5', 10),
    topics: {
      reminder: process.env.KAFKA_REMINDER_TOPIC || 'reminder-topic',
      notification: process.env.KAFKA_NOTIFICATION_TOPIC || 'notification-topic',
      progress: process.env.KAFKA_PROGRESS_TOPIC || 'progress-topic',
      studySession: process.env.KAFKA_SESSION_TOPIC || 'study-session-topic',
      analytics: process.env.KAFKA_ANALYTICS_TOPIC || 'analytics-topic',
      studyCompleted: process.env.KAFKA_STUDY_COMPLETED_TOPIC || 'study.session.completed',
      reminderFailed: process.env.KAFKA_REMINDER_FAILED_TOPIC || 'reminder.failed',
    },
  };

  // Validate configuration
  if (config.connectionTimeout < 100) {
    throw new Error('KAFKA_CONNECTION_TIMEOUT must be at least 100ms');
  }

  if (config.connectionTimeout > 60000) {
    throw new Error(
      'KAFKA_CONNECTION_TIMEOUT must not exceed 60000ms (60 seconds)',
    );
  }

  if (config.retries < 0 || config.retries > 10) {
    throw new Error('KAFKA_RETRIES must be between 0 and 10');
  }

  if (config.brokers.length === 0) {
    throw new Error('At least one Kafka broker must be configured');
  }

  // Validate broker addresses
  config.brokers.forEach((broker, index) => {
    const [host, port] = broker.split(':');
    if (!host || !port) {
      throw new Error(
        `Invalid Kafka broker format at index ${index}: ${broker}. Expected format: host:port`,
      );
    }
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      throw new Error(
        `Invalid port in Kafka broker at index ${index}: ${port}`,
      );
    }
  });

  return config;
});
