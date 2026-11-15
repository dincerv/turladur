import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly client: Redis;

  constructor(config: ConfigService) {
    const redisUrl = config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });

    this.client.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.client.get(key);
      if (raw === null) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.warn(
        `Redis get failed for ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      this.logger.warn(
        `Redis set failed for ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(
        `Redis del failed for ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      // Never fail writes (experience/tour update) because Redis is briefly down.
      this.logger.warn(
        `Redis invalidatePattern(${pattern}) failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const probeKey = 'health:probe';
      await this.set(probeKey, 'ok', 5);
      const value = await this.get<string>(probeKey);
      await this.del(probeKey);
      return value === 'ok';
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return false;
    }
  }
}
