import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/stores',
  cors: { origin: '*' },
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const storeId = client.handshake.query.storeId as string;
    if (storeId) {
      client.join(`store:${storeId}`);
      this.logger.debug(`Client ${client.id} joined store:${storeId}`);
    }
  }

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() storeId: string) {
    client.join(`store:${storeId}`);
    return { joined: storeId };
  }

  emitToStore(storeId: string, event: string, payload: unknown) {
    this.server.to(`store:${storeId}`).emit(event, payload);
  }
}
