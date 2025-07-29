// Import transaction service
import * as transactionService from '../api/services/transactionService';

// Test suite for transaction service
describe('Transactions', () => {
  it('should fetch all transactions', async () => {
    const transactions = await transactionService.getAllTransactions();
    expect(Array.isArray(transactions)).toBe(true);
  });

  // Test for creating a new transaction
  it('should create new transaction', async () => {
    const transaction = await transactionService.createTransaction({ amount: 2000, type: 'withdrawal'});
    expect(transaction).toHaveProperty('id');
  });

  // Test for getting a transaction by ID
  it('should get transaction by it own Id', async () => {
    const created = await transactionService.createTransaction({ amount: 2000, type: 'withdrawal' });
    const transaction = await transactionService.getTransactionById(created.id);
    expect(transaction).toHaveProperty('id')
  })

  // Test for updating a transaction
  it('should update transaction', async () => {
    const created = await transactionService.createTransaction({ amount: 2000, type: 'withdrawal' });
    const updated = await transactionService.updateTransaction(created.id, { amount: 3000, type: 'deposit' })
    expect(updated).toHaveProperty('id');
    expect(updated.amount).toBe(3000);
    expect(updated.type).toBe('deposit');
  })

  // Test for deleting a transaction
  it('should delete transaction', async ()=> {
    const created = await transactionService.createTransaction({ amount: 3000, type: 'deposit' });
    const deleted = await transactionService.deleteTransaction(created.id);
    expect(deleted).toHaveProperty('id');
  })
});