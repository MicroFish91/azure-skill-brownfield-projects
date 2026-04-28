import { CosmosClient, type Container, type Database } from '@azure/cosmos';
import type { Order } from '@app/shared';
import type { IOrderRepository } from './interfaces/IOrderRepository';
import { getLogger } from '../logger';

const log = getLogger('cosmosOrderRepository');

export class CosmosOrderRepository implements IOrderRepository {
  private client: CosmosClient;
  private databaseId: string;
  private containerId: string;
  private container: Container | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(connectionString: string, databaseId: string, containerId: string) {
    this.client = new CosmosClient(connectionString);
    this.databaseId = databaseId;
    this.containerId = containerId;
  }

  async initialize(): Promise<void> {
    if (this.container) return;
    if (!this.initPromise) {
      this.initPromise = this.bootstrap();
    }
    await this.initPromise;
  }

  private async bootstrap(): Promise<void> {
    const { database }: { database: Database } = await this.client.databases.createIfNotExists({
      id: this.databaseId,
    });
    const { container } = await database.containers.createIfNotExists({
      id: this.containerId,
      partitionKey: { paths: ['/orderId'] },
    });
    this.container = container;
    log.info({ db: this.databaseId, container: this.containerId }, 'cosmos container ready');
  }

  async create(order: Order): Promise<Order> {
    await this.initialize();
    const { resource } = await this.container!.items.create<Order>(order);
    if (!resource) {
      throw new Error('Cosmos create returned no resource');
    }
    return stripMeta(resource as unknown as Record<string, unknown>);
  }

  async findById(orderId: string): Promise<Order | null> {
    await this.initialize();
    try {
      const { resource } = await this.container!.item(orderId, orderId).read<Order>();
      return resource ? stripMeta(resource as unknown as Record<string, unknown>) : null;
    } catch (err: unknown) {
      if (isNotFound(err)) return null;
      throw err;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.initialize();
      await this.container!.read();
      return true;
    } catch (err) {
      log.warn({ err }, 'cosmos health check failed');
      return false;
    }
  }
}

function isNotFound(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 404;
}

function stripMeta(doc: Record<string, unknown>): Order {
  const { _rid, _self, _etag, _attachments, _ts, ...clean } = doc;
  void _rid;
  void _self;
  void _etag;
  void _attachments;
  void _ts;
  return clean as unknown as Order;
}
