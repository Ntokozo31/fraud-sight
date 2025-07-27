import { prisma } from '../utils/prismaClient'

// Get all transactions
export const getAllTransactions = () => prisma.transaction.findMany();

// Create a new transaction
export const createTransaction = (data: { amount: number; type: string }) =>
  prisma.transaction.create({ data });

// Get transaction by its ID
export const getTransactionById = (id: number ) =>
  prisma.transaction.findUnique({ where: { id }});

// Update transaction by its ID
export const updateTransaction = (id: number, data: { amount: number; type: string }) =>
  prisma.transaction.update({ where: { id }, data });

// Delete transaction by its ID
export const deleteTransaction = (id: number) =>
  prisma.transaction.delete({ where: { id }});