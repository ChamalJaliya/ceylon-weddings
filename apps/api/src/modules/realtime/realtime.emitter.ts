import { Injectable } from "@nestjs/common";
import type { Server } from "socket.io";

@Injectable()
export class RealtimeEmitter {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  toUser(userId: string, event: string, payload: unknown) {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  toConversation(conversationId: string, event: string, payload: unknown) {
    this.server?.to(`conversation:${conversationId}`).emit(event, payload);
  }

  toUsers(userIds: string[], event: string, payload: unknown) {
    for (const userId of userIds) {
      this.toUser(userId, event, payload);
    }
  }
}
