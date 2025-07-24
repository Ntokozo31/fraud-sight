import { Request, Response } from 'express';

import { prisma } from '../utils/prismaClient';

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