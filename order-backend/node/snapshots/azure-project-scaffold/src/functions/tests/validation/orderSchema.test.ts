import { createOrderSchema, orderIdParamSchema } from '@app/shared';

describe('createOrderSchema', () => {
  it('accepts a valid order body', () => {
    const result = createOrderSchema.safeParse({
      customerId: 'cust-1',
      items: [{ sku: 'a', quantity: 1, unitPrice: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty items array', () => {
    const result = createOrderSchema.safeParse({ customerId: 'cust-1', items: [] });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive quantity', () => {
    const result = createOrderSchema.safeParse({
      customerId: 'cust-1',
      items: [{ sku: 'a', quantity: 0, unitPrice: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative unitPrice', () => {
    const result = createOrderSchema.safeParse({
      customerId: 'cust-1',
      items: [{ sku: 'a', quantity: 1, unitPrice: -1 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing customerId', () => {
    const result = createOrderSchema.safeParse({
      items: [{ sku: 'a', quantity: 1, unitPrice: 1 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('orderIdParamSchema', () => {
  it('accepts a UUID', () => {
    expect(
      orderIdParamSchema.safeParse('11111111-1111-4111-8111-111111111111').success,
    ).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    expect(orderIdParamSchema.safeParse('not-a-uuid').success).toBe(false);
  });
});
