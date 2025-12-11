import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  enabled: process.env.REDIS_ENABLED !== 'false', // Enabled by default
  ttl: parseInt(process.env.REDIS_TTL || '60000', 10), // Default 1 minute in ms
}));
