import { prisma } from '../utils/prismaClient';
import { TransactionServiceCreateData, TransactionResponse } from '../types/transaction';
import { TransactionSearchQuery } from '../validation/transactionSchema';


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


// Transaction search with fraud detection capabilities
export const searchTransactions = async (
  filters: TransactionSearchQuery,
  userId?: number 
) => {
  try {
    // Build dynamic where clause
    const where: any = {};
    
    // User restriction 
    if (userId) {
      where.userId = userId;
    }
    
    // Amount filters
    if (filters.amount_min || filters.amount_max) {
      where.amount = {};
      if (filters.amount_min) where.amount.gte = filters.amount_min;
      if (filters.amount_max) where.amount.lte = filters.amount_max;
    }
    
    // Date filters
    if (filters.date_from || filters.date_to || filters.created_hours_ago) {
      where.createdAt = {};
      if (filters.date_from) where.createdAt.gte = new Date(filters.date_from);
      if (filters.date_to) where.createdAt.lte = new Date(filters.date_to);
      if (filters.created_hours_ago) {
        const hoursAgo = new Date();
        hoursAgo.setHours(hoursAgo.getHours() - filters.created_hours_ago);
        where.createdAt.gte = hoursAgo;
      }
    }
    
    // User filters
    if (filters.user_id) {
      where.userId = filters.user_id;
    }
    
    if (filters.user_created_days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filters.user_created_days);
      where.user = {
        createdAt: { gte: daysAgo }
      };
    }
    
    // Transaction filters
    if (filters.type) {
      where.type = filters.type;
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    // Search functionality
    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { merchant: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    // Pagination calculation
    const skip = (filters.page - 1) * filters.limit;
    
    // Sorting logic
    let orderBy: any = { createdAt: 'desc' };
    if (filters.sort) {
      if (filters.sort.startsWith('-')) {
        const field = filters.sort.substring(1);
        orderBy = { [field]: 'desc' };
      } else {
        orderBy = { [filters.sort]: 'asc' };
      }
    }
    
    // Execute search with pagination
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          }
        },
        orderBy,
        skip,
        take: filters.limit
      }),
      prisma.transaction.count({ where })
    ]);
    
    // Calculate analytics
    const analytics = await calculateTransactionAnalytics(where);
    
    // Build response
    const totalPages = Math.ceil(total / filters.limit);
    
    return {
      transactions,
      pagination: {
        currentPage: filters.page,
        totalPages,
        totalTransactions: total,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1
      },
      analytics
    };
    
  } catch (error) {
    console.error('Error searching transactions:', error);
    throw new Error('Failed to search transactions');
  }
};

// Calculate analytics for fraud detection
export const calculateTransactionAnalytics = async (where: any) => {
  try {
    const analytics = await prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _avg: { amount: true },
      _count: { id: true }
    });
    
    // Count suspicious transactions
    const suspiciousCount = await prisma.transaction.count({
      where: {
        ...where,
        OR: [
          { amount: { gte: 10000 } },
          { 
            AND: [
              { amount: { gte: 5000 } },
              { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            ]
          },
          {
            AND: [
              { type: 'withdrawal' },
              { amount: { gte: 1000 } }
            ]
          }
        ]
      }
    });
    
    return {
      totalAmount: analytics._sum.amount || 0,
      averageAmount: analytics._avg.amount || 0,
      transactionCount: analytics._count.id || 0,
      suspiciousCount: suspiciousCount
    };
    
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return {
      totalAmount: 0,
      averageAmount: 0,
      transactionCount: 0,
      suspiciousCount: 0
    };
  }
};