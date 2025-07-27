import { prisma } from '../utils/prismaClient'

// Get all transactions
// This function retrieves all transactions from the database.
export const getAllTransactions = () => prisma.transaction.findMany();

// Create a new transaction
// This function creates a new transaction in the database.
export const createTransaction = (data: { amount: number; type: string }) =>
  prisma.transaction.create({ data });

// Get transaction by its ID
// This function retrieves a transaction by its unique ID.
export const getTransactionById = (id: number ) =>
  prisma.transaction.findUnique({ where: { id }});

// Update transaction by its ID
// This function updates an existing transaction with the provided ID and data.
export const updateTransaction = (id: number, data: { amount: number; type: string }) =>
  prisma.transaction.update({ where: { id }, data });

// Delete transaction by its ID
// This function deletes a transaction by its unique ID.
export const deleteTransaction = (id: number) =>
  prisma.transaction.delete({ where: { id }});