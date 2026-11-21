import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { AppNotification } from '@turta/shared-types';
import { Server, Socket } from 'socket.io';

import type { JwtPayload } from '../auth/types/auth.types';

function parseCorsOrigins(raw: string | undefined): string | string[] {
  const origins = (raw ?? 'http://localhost:3001')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: parseCorsOrigins(process.env.FRONTEND_URL),
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      });

      if (!payload?.sub) {
        client.disconnect(true);
        return;
      }

      const room = this.userRoom(payload.sub);
      await client.join(room);
      client.data.userId = payload.sub;
    } catch (err) {
      this.logger.debug(`WS auth failed: ${String(err)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.userId as string | undefined;
    if (userId) {
      this.logger.debug(`WS disconnect user=${userId}`);
    }
  }

  /**
   * Push a newly created in-app notification to the owner's socket room.
   * Failures must never affect persistence — callers wrap in try/catch.
   */
  emitNotificationCreated(userId: string, notification: AppNotification): void {
    if (!this.server) return;
    this.server
      .to(this.userRoom(userId))
      .emit('notification.created', notification);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.trim();
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7).trim() || null;
    }

    return null;
  }
}
