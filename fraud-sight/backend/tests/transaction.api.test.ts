import request from 'supertest';

// Import the app
import app from '../api/app';

// Test suits for transaction API
describe('Transaction API', () => {
  // Test for creating a new transaction via API
  it('should create a new transaction via API', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({ amount: 2000, type: 'withdrawal' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    }, 15000);

  // Test for fetching all transactions via API
  it('should fetch all transactions via API', async () => {
    const res = await request(app)
      .get('/api/transactions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.transactions)).toBe(true);
  });

  // Test for updating a transaction by its ID via API
  it('should update transaction by its Id via API', async () => {
    const created = await request(app)
      .post('/api/transactions')
      .send({ amount: 2000, type: 'withdrawal' });
    const res = await request(app)
      .put(`/api/transactions/${created.body.id}`)
      .send({ amount: 3000, type: 'deposit' });
    expect(res.status).toBe(200);
    expect(res.body.transaction.amount).toBe(3000);
    expect(res.body.transaction.type).toBe('deposit');
  });

  // Test for getting a transaction by its ID via API
  it('should get transaction by its Id via API', async () => {
    const created = await request(app)
      .post('/api/transactions')
      .send({ amount: 2000, type: 'withdrawal' });
    const res = await request(app)
      .get(`/api/transactions/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.transaction).toHaveProperty('id');
  });

  // Test for deleting a transaction via API
  it('should delete transaction by its Id via API', async () => {
    const created = await request(app)
      .post('/api/transactions')
      .send({ amount: 2000, type: 'withdrawal' });
    const res = await request(app)
      .delete(`/api/transactions/${created.body.id}`);
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('message');
  });
});