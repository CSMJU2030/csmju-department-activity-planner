import { AddressInfo } from 'net';
import { IncomingMessage, ServerResponse, createServer, Server } from 'http';
import { TestSigningKey, jwksDocument } from './token-factory';

/**
 * A minimal stand-in for Core Hub, used by the e2e suite. It serves what the
 * subsystem reads from the real Core Hub: the JWKS document (public keys
 * only) and the rooms reference data (GET /api/v1/rooms, which needs a
 * Bearer token like the real one).
 */
export class FakeCoreHub {
  private server?: Server;
  private keys: TestSigningKey[] = [];
  private rooms: Array<Record<string, unknown> & { isActive: boolean }> = [];

  /** JWKS downloads. */
  requestCount = 0;
  /** GET /api/v1/rooms calls. */
  roomRequests = 0;
  /** The Authorization header of the latest rooms call. */
  lastRoomsAuthorization: string | undefined;
  /** While true, reference data answers 503 as if Core Hub were down. */
  referenceDataDown = false;

  async start(keys: TestSigningKey[]): Promise<void> {
    this.keys = keys;
    this.server = createServer((req, res) => {
      if (req.url?.startsWith('/api/v1/.well-known/jwks.json')) {
        this.requestCount += 1;
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify(jwksDocument(this.keys)));
        return;
      }
      if (req.url?.startsWith('/api/v1/rooms')) {
        this.serveRooms(req, res);
        return;
      }
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    });

    await new Promise<void>((resolve) => this.server!.listen(0, '127.0.0.1', resolve));
  }

  /** Simulates Core Hub key rotation. */
  rotate(keys: TestSigningKey[]): void {
    this.keys = keys;
  }

  /** The rooms Core Hub holds, in the shape of its GET /api/v1/rooms. */
  setRooms(rooms: Array<Record<string, unknown> & { isActive: boolean }>): void {
    this.rooms = rooms;
  }

  /** The reference data contract: paged envelope, open rooms unless includeInactive=true. */
  private serveRooms(req: IncomingMessage, res: ServerResponse): void {
    this.roomRequests += 1;
    this.lastRoomsAuthorization = req.headers.authorization;

    const send = (status: number, body: unknown) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };

    if (!/^Bearer \S+$/.test(req.headers.authorization ?? '')) {
      send(401, { success: false, error: { code: 'UNAUTHORIZED', message: 'token required' } });
      return;
    }
    if (this.referenceDataDown) {
      send(503, { success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'down' } });
      return;
    }

    const query = new URL(req.url ?? '/', 'http://core-hub.test').searchParams;
    const page = Number(query.get('page') ?? '1');
    const limit = Number(query.get('limit') ?? '20');
    const rooms =
      query.get('includeInactive') === 'true' ? this.rooms : this.rooms.filter((room) => room.isActive);

    send(200, {
      success: true,
      data: rooms.slice((page - 1) * limit, page * limit),
      meta: { total: rooms.length, page, limit, totalPages: Math.max(1, Math.ceil(rooms.length / limit)) },
      requestId: 'fake-core-hub',
      timestamp: new Date().toISOString(),
    });
  }

  get port(): number {
    return (this.server!.address() as AddressInfo).port;
  }

  get url(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  get jwksUrl(): string {
    return `${this.url}/api/v1/.well-known/jwks.json`;
  }

  async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve, reject) =>
        this.server!.close((error) => (error ? reject(error) : resolve())),
      );
      this.server = undefined;
    }
  }
}
