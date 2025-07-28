import { Request, Response } from 'express';

// Import transaction service
import * as transactionService from '../services/transactionService';

// Import redis client
import { redis } from '../../redis/redisClient';

// Import logger utility
import { log } from '../utils/logger';

// Get all transactions controller function
export const getAllTransactions = async (req: Request, res: Response) => {
  const cacheKey = 'transactions: allTransactions';
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      log('Cache hit for transaction');
      return res.status(200).json(JSON.parse(cached));
    }

    const transactions = await transactionService.getAllTransactions();
    log('Cache miss for transactions');
    await redis.set(cacheKey, JSON.stringify(transactions), { EX: 60 });
    log('Transactions catched in Redis');
    res.status(200).json({ message: 'Transactions', transactions })
  } catch (_error) {
    log('Error fetching transactions')
    res.status(500).json({ message: 'Failed to fetch transactions'})
  }
}


// Create transaction controller function
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, type } = req.body;
    const transaction = await transactionService.createTransaction({ amount, type })
    await redis.del('transactions: allTransactions');
    log('Transaction created: ' + JSON.stringify(transaction));
    res.status(201).json(transaction)
  } catch (_error) {
    res.status(500).json({ message: 'Failed to create transaction' })
  }
}

// Get transaction by it own id
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const id  = Number(req.params.id);
    const transaction = await transactionService.getTransactionById(id);
    await redis.del('transactions: allTransactions');
    log('Transaction fetched: ' + JSON.stringify(transaction))
    if (!transaction) {
      return res.status(404).json({ message: 'No transaction found' });
    }
    res.status(200).json({ message: 'Your transaction', transaction });
  } catch (_error) {
    res.status(500).json({ message: 'Failed to fetch transaction' });
  }
};

// Update transaction by its ID controller function
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { amount, type } = req.body;

    const transaction = await transactionService.updateTransaction(id, { amount, type })
    await redis.del('transactions: allTransactions')
    log('Transaction successfully updated')
    res.status(200).json({ message: 'Successfully updated', transaction })
    } catch (_error) {
      res.status(500).json({ message: 'Failed to update transaction'})
    }
};


// Delete transaction by it Id controller function
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await transactionService.deleteTransaction(id);
    await redis.del('transactions: allTransactions');
    log('Transaction succesfully deleted')
    res.status(200).json({ message: 'Successfully deleted'})
  } catch (_error) {
    res.status(500).json({ message: 'Failed to delete transaction'})
  }
}