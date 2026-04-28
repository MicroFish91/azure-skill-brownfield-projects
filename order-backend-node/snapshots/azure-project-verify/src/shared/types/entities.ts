export type OrderStatus = 'Pending' | 'Validated' | 'Rejected';

export interface OrderItem {
  sku: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  status: OrderStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}
