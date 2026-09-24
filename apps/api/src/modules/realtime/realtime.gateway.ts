import { Logger, Inject, forwardRef } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "@ceylonweddings/database";
import { COOKIES, type SendMessageBody, type User } from "@ceylonweddings/contracts";
import type { Server, Socket } from "socket.io";
import { MessagingService } from "../messaging/messaging.service";
import { RealtimeEmitter } from "./realtime.emitter";

type AccessPayload = {
  sub: string;
  email: string;
  role: User["role"];
};

type AuthedSocket = Socket & { data: { user?: User } };

function cookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

@WebSocketGateway({
  path: "/realtime",
  cors: { origin: true, credentials: true },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly emitter: RealtimeEmitter,
    @Inject(forwardRef(() => MessagingService))
    private readonly messaging: MessagingService,
  ) {}

  afterInit(server: Server) {
    this.emitter.setServer(server);
  }

  async handleConnection(client: AuthedSocket) {
    try {
      const token = cookieValue(client.handshake.headers.cookie, COOKIES.access);
      if (!token) throw new Error("Missing access cookie");

      const payload = await this.jwt.verifyAsync<AccessPayload>(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status === "SUSPENDED") {
        throw new Error("Invalid user");
      }

      const mapped: User = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        locale: user.locale as User["locale"],
        currency: user.currency as User["currency"],
        createdAt: user.createdAt.toISOString(),
      };
      client.data.user = mapped;
      await client.join(`user:${user.id}`);
      this.logger.log(`socket connected ${client.id} user=${user.id}`);
    } catch (error) {
      this.logger.warn(`socket rejected ${client.id}: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  @SubscribeMessage("join.wedding")
  async joinWedding(@ConnectedSocket() client: AuthedSocket, @MessageBody() weddingId: string) {
    const user = this.requireUser(client);
    const membership = await this.prisma.weddingMember.findUnique({
      where: { weddingId_userId: { weddingId, userId: user.id } },
    });
    if (!membership && user.role !== "ADMIN") {
      throw new WsException("Not a wedding member");
    }
    await client.join(`wedding:${weddingId}`);
    return { joined: weddingId };
  }

  @SubscribeMessage("conversation.join")
  async joinConversation(@ConnectedSocket() client: AuthedSocket, @MessageBody() conversationId: string) {
    const user = this.requireUser(client);
    const allowed = await this.messaging.canAccessConversation(user, conversationId);
    if (!allowed) throw new WsException("Not allowed");
    await client.join(`conversation:${conversationId}`);
    return { joined: conversationId };
  }

  @SubscribeMessage("conversation.leave")
  async leaveConversation(@ConnectedSocket() client: AuthedSocket, @MessageBody() conversationId: string) {
    this.requireUser(client);
    await client.leave(`conversation:${conversationId}`);
    return { left: conversationId };
  }

  @SubscribeMessage("message.send")
  async sendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { conversationId: string } & SendMessageBody,
  ) {
    const user = this.requireUser(client);
    const { conversationId, ...body } = payload;
    return this.messaging.sendMessage(user, conversationId, body);
  }

  @SubscribeMessage("message.read")
  async readMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() payload: { conversationId: string; readAt?: string },
  ) {
    const user = this.requireUser(client);
    return this.messaging.markRead(user, payload.conversationId, { readAt: payload.readAt });
  }

  @SubscribeMessage("typing.start")
  async typingStart(@ConnectedSocket() client: AuthedSocket, @MessageBody() conversationId: string) {
    const user = this.requireUser(client);
    const allowed = await this.messaging.canAccessConversation(user, conversationId);
    if (!allowed) return { ok: false };
    this.messaging.emitTyping(user, conversationId, true);
    return { ok: true };
  }

  @SubscribeMessage("typing.stop")
  async typingStop(@ConnectedSocket() client: AuthedSocket, @MessageBody() conversationId: string) {
    const user = this.requireUser(client);
    const allowed = await this.messaging.canAccessConversation(user, conversationId);
    if (!allowed) return { ok: false };
    this.messaging.emitTyping(user, conversationId, false);
    return { ok: true };
  }

  private requireUser(client: AuthedSocket): User {
    if (!client.data.user) throw new WsException("Unauthenticated socket");
    return client.data.user;
  }
}
