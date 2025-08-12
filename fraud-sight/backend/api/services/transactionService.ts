import { prisma } from '../utils/prismaClient';
import { TransactionServiceCreateData, TransactionResponse } from '../types/transaction';

// Create transaction with user ownership
export const createTransaction = async (data: TransactionServiceCreateData): Promise<TransactionResponse> => {
  return await prisma.transaction.create({
    data: {
      amount: data.amount,
      type: data.type,
      userId: data.userId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

// Get all transactions for a specific user
export const getUserTransactions = async (userId: number): Promise<TransactionResponse[]> => {
  return await prisma.transaction.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

// Get single transaction with ownership check
export const getTransactionById = async (
  transactionId: number, 
  userId: number, 
  userRole: string
): Promise<TransactionResponse | null> => {
  const transaction = await prisma.transaction.findUnique({
    where: {
      id: transactionId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  // Security check
  if (transaction && (transaction.userId === userId || userRole === 'admin')) {
    return transaction;
  }

  return null;
};

// Admin function get all transactions with admin only
export const getAllTransactions = async (): Promise<TransactionResponse[]> => {
  return await prisma.transaction.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

// Update transaction with ownership check
export const updateTransaction = async (
  transactionId: number,
  userId: number,
  userRole: string,
  updateData: Partial<{ amount: number; type: string }>
): Promise<TransactionResponse | null> => {
  // First check if user owns the transaction or is admin
  const existingTransaction = await getTransactionById(transactionId, userId, userRole);
  
  if (!existingTransaction) {
    return null;
  }

  return await prisma.transaction.update({
    where: {
      id: transactionId
    },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
};

// Delete transaction
export const deleteTransaction = async (
  transactionId: number,
  userId: number,
  userRole: string
): Promise<boolean> => {
  // First check if user owns the transaction or is admin
  const existingTransaction = await getTransactionById(transactionId, userId, userRole);
  
  if (!existingTransaction) {
    return false;
  }

  await prisma.transaction.delete({
    where: {
      id: transactionId
    }
  });

  return true;
};