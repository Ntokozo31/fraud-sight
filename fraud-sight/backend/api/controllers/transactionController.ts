import { Request, Response } from 'express';

// Import transaction service
import * as transactionService from '../services/transactionService'


// Get all transactions controller function
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await transactionService.getAllTransactions();
    res.status(200).json(transactions)
  } catch (_error) {
    res.status(500).json({ message: 'Failed to fetch transactions'})
  }
}


// Create transaction controller function
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, type } = req.body;
    const transaction = await transactionService.createTransaction({ amount, type })
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

    // Check if transaction exist
    const existing = await transactionService.getTransactionById(id)
    if (!existing) {
      return res.status(404).json({ message: 'No transaction found' })
    }

    const transaction = await transactionService.updateTransaction(id, { amount, type })
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
    res.status(200).json({ message: 'Successfully deleted'})
  } catch (_error) {
    res.status(500).json({ message: 'Failed to delete transaction'})
  }
}