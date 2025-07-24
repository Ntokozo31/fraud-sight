import { Request, Response } from 'express';

import { prisma } from '../utils/prismaClient';
import { request } from 'http';

// Get all transactions controller function
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany();
    res.status(200).json(transactions)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transactions'})
  }
}


// Create transaction controller function
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, type } = req.body;
    if (!amount || !type) {
      return res.status(400).json({ message: 'amount and type are required' })
    }
    const transaction = await prisma.transaction.create({ data: { amount, type } })
    res.status(201).json(transaction)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create transaction' })
  }
}

// Get transaction by it own id
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const transaction = await prisma.transaction.findUnique({ where: { id: Number(id)}})
    if (!transaction) {
      return res.status(404).json({ message: 'No transaction found'})
    }
    res.status(200).json({ message: 'Your transaction', transaction})
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch transaction' })
  }
};

// Update transcation by it Id controller function 
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, type } = req.body;

    // Check if transaction exist
    const existing = await prisma.transaction.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return res.status(404).json({ message: 'No transaction found' })
    }

    const transaction = await prisma.transaction.update({
      where: { id: Number(id)},
      data: { amount: Number(amount), type }
    });
    res.status(200).json({ message: 'Successufully updated', transaction})
    } catch (error) {
      res.status(500).json({ message: 'Failed to update transaction'})
    }
}


// Delete transaction by it Id controller function
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.transaction.delete({ where: {id: Number(id) } });
    res.status(200).json({ message: 'Successfully deleted'})
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete transaction'})
  }
}