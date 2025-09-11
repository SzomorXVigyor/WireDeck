import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, WebSocket, RawData } from 'ws';
import { VncService } from './vnc.service';
import * as net from 'net';
import { URL } from 'url';
import { FRONTEND_URL } from '../utils/env';

@WebSocketGateway({
  cors: { origin: FRONTEND_URL },
  path: '/api/vnc/connect', // Fixed endpoint
})
export class VncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connections = new Map<WebSocket, net.Socket>();

  constructor(private readonly vncService: VncService) {}

  handleConnection(client: WebSocket, ...args: any[]) {
    const req = args[0]; // IncomingMessage
    const urlStr = req?.url || '';

    // Parse query param: /api/vnc/connect?target=xxx
    const url = new URL(urlStr, 'ws://localhost'); // base doesn't matter
    const targetName = url.searchParams.get('wss_identifier');

    console.log(req)
    console.log(urlStr)

    if (!targetName) {
      console.log('❌ No target provided in query param');
      client.close();
      return;
    }

    const target = this.vncService.getTargetByName(targetName);
    if (!target) {
      console.log(`❌ Target not found: ${targetName}`);
      client.close();
      return;
    }

    console.log(`🎯 WebSocket connected to target: ${target.name} (${target.ip}:${target.port})`);
    this.handleVNCConnection(client, target);
  }

  handleDisconnect(client: WebSocket) {
    const tcpSocket = this.connections.get(client);
    if (tcpSocket) {
      tcpSocket.destroy();
      this.connections.delete(client);
    }
    console.log('🔌 WebSocket disconnected');
  }

  private handleVNCConnection(ws: WebSocket, target: any) {
    const tcpSocket = net.createConnection({ host: target.ip, port: target.port });
    this.connections.set(ws, tcpSocket);
    tcpSocket.setTimeout(10000);

    tcpSocket.on('connect', () => {
      console.log(`✅ TCP connected to ${target.name}`);
    });

    tcpSocket.on('timeout', () => {
      console.error(`⏰ TCP connection timeout for ${target.name}`);
      ws.close();
    });

    tcpSocket.on('error', (err) => {
      console.error(`❌ TCP error for ${target.name}: ${err.message}`);
      ws.close();
    });

    tcpSocket.on('close', () => {
      ws.close();
      this.connections.delete(ws);
    });

    // WebSocket -> TCP
    ws.on('message', (data: RawData) => {
      let buffer: Buffer;

      if (Buffer.isBuffer(data)) buffer = data;
      else if (data instanceof ArrayBuffer) buffer = Buffer.from(data);
      else if (Array.isArray(data)) buffer = Buffer.concat(data);
      else buffer = Buffer.from(data as string);

      tcpSocket.write(buffer);
    });

    // TCP -> WebSocket
    tcpSocket.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    ws.on('close', () => {
      tcpSocket.destroy();
      this.connections.delete(ws);
    });

    ws.on('error', () => {
      tcpSocket.destroy();
      this.connections.delete(ws);
    });
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any): void {
    // Optional extra WebSocket messages
  }
}
