import { Request, Response } from 'express';
import * as transactionService from '../services/transactionService';
import { CreateTransactionRequest } from '../types/transaction';
import { redis } from '../../redis/redisClient';
import { log } from '../utils/logger';


// Get transactions for the authenticated user
export const getUserTransactions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const cacheKey = `transactions:user:${userId}`;

    try {
      // Check cache first with error handling
      const cachedTransactions = await redis.get(cacheKey);
      if (cachedTransactions) {
        return res.status(200).json(JSON.parse(cachedTransactions));
      }
    } catch (redisError: any) {
      log(`Redis cache error: ${redisError.message} - proceeding without cache`);
    }

    // Get user's transactions
    const transactions = await transactionService.getUserTransactions(userId);

    try {
      // Cache for 5 minutes with error handling
      await redis.setEx(cacheKey, 300, JSON.stringify(transactions));
    } catch (redisError: any) {
      log(`Redis cache set error: ${redisError.message} - data retrieved successfully anyway`);
    }

    log(`Retrieved ${transactions.length} transactions for user ${userId}`);
    res.status(200).json(transactions);

  } catch (error: any) {
    log(`Error retrieving user transactions: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to retrieve transactions' 
    });
  }
};

// Create a new transaction requires authentication
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { amount, type }: CreateTransactionRequest = req.body;
    
    // Check if user exists
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const userId = req.user.id;

    // Validate input
    if (!amount || !type) {
      return res.status(400).json({ 
        message: 'Amount and type are required' 
      });
    }

    if (amount <= 0) {
      return res.status(400).json({ 
        message: 'Amount must be greater than 0' 
      });
    }

    // Create transaction with user ownership
    const transaction = await transactionService.createTransaction({
      amount,
      type,
      userId
    });

    try {
      // Clear user specific cache
      await redis.del(`transactions:user:${userId}`);
      await redis.del('transactions:all');
    } catch (redisError: any) {
      log(`Redis cache clear error: ${redisError.message} - transaction created successfully anyway`);
    }

    log(`Transaction created for user ${userId}: ${JSON.stringify(transaction)}`);
    res.status(201).json(transaction);

  } catch (error: any) {
    log(`Error creating transaction: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to create transaction' 
    });
  }
};

// Get all transactions admin only
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const cacheKey = 'transactions:all';

    try {
      // Check cache first
      const cachedTransactions = await redis.get(cacheKey);
      if (cachedTransactions) {
        return res.status(200).json(JSON.parse(cachedTransactions));
      }
    } catch (redisError: any) {
      log(`Redis cache error: ${redisError.message} - proceeding without cache`);
    }

    // Get all transactions admin only
    const transactions = await transactionService.getAllTransactions();

    try {
      // Cache for 2 minutes
      await redis.setEx(cacheKey, 120, JSON.stringify(transactions));
    } catch (redisError: any) {
      log(`Redis cache set error: ${redisError.message} - data retrieved successfully anyway`);
    }

    log(`Admin ${req.user.id} retrieved all transactions (${transactions.length} total)`);
    res.status(200).json(transactions);

  } catch (error: any) {
    log(`Error retrieving all transactions: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to retrieve transactions' 
    });
  }
};

// Get single transaction by ID with ownership check
export const getTransactionById = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const transactionId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    if (isNaN(transactionId)) {
      return res.status(400).json({ 
        message: 'Invalid transaction ID' 
      });
    }

    const transaction = await transactionService.getTransactionById(
      transactionId, 
      userId, 
      userRole
    );

    if (!transaction) {
      return res.status(404).json({ 
        message: 'Transaction not found or access denied' 
      });
    }

    log(`User ${userId} accessed transaction ${transactionId}`);
    res.status(200).json(transaction);

  } catch (error: any) {
    log(`Error retrieving transaction: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to retrieve transaction' 
    });
  }
};

// Update transaction with ownership check
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const transactionId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;
    const { amount, type } = req.body;

    if (isNaN(transactionId)) {
      return res.status(400).json({ 
        message: 'Invalid transaction ID' 
      });
    }

    // Validate update data
    const updateData: Partial<{ amount: number; type: string }> = {};
    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({ 
          message: 'Amount must be greater than 0' 
        });
      }
      updateData.amount = amount;
    }
    if (type !== undefined) {
      updateData.type = type;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        message: 'No valid fields to update' 
      });
    }

    const updatedTransaction = await transactionService.updateTransaction(
      transactionId,
      userId,
      userRole,
      updateData
    );

    if (!updatedTransaction) {
      return res.status(404).json({ 
        message: 'Transaction not found or access denied' 
      });
    }

    try {
      // Clear relevant caches
      await redis.del(`transactions:user:${userId}`);
      await redis.del('transactions:all');
    } catch (redisError: any) {
      log(`Redis cache clear error: ${redisError.message} - transaction updated successfully anyway`);
    }

    log(`User ${userId} updated transaction ${transactionId}`);
    res.status(200).json(updatedTransaction);

  } catch (error: any) {
    log(`Error updating transaction: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to update transaction' 
    });
  }
};

// Delete transaction with ownership check
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const transactionId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    if (isNaN(transactionId)) {
      return res.status(400).json({ 
        message: 'Invalid transaction ID' 
      });
    }

    const deleted = await transactionService.deleteTransaction(
      transactionId,
      userId,
      userRole
    );

    if (!deleted) {
      return res.status(404).json({ 
        message: 'Transaction not found or access denied' 
      });
    }

    try {
      // Clear relevant caches
      await redis.del(`transactions:user:${userId}`);
      await redis.del('transactions:all');
    } catch (redisError: any) {
      log(`Redis cache clear error: ${redisError.message} - transaction deleted successfully anyway`);
    }

    log(`User ${userId} deleted transaction ${transactionId}`);
    res.status(200).json({ 
      message: 'Transaction deleted successfully' 
    });

  } catch (error: any) {
    log(`Error deleting transaction: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to delete transaction' 
    });
  }
};



// Transaction search with fraud detection
export const searchTransactions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse and validate query parameters
    const filters = req.query as any;

    // Determine user access level
    const isAdmin = req.user.role === 'admin';
    const userId = isAdmin ? undefined : req.user.id;

    // Execute search
    const result = await transactionService.searchTransactions(filters, userId);

    // Add search metadata
    const response = {
      ...result,
      filters: {
        applied: filters,
        userType: isAdmin ? 'admin' : 'customer',
        restrictedToUser: !isAdmin
      },
      metadata: {
        searchedAt: new Date().toISOString(),
        searchedBy: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        }
      }
    };

    log(`Transaction search executed by ${req.user.email} with ${result.pagination.totalTransactions} results`);

    res.status(200).json(response);

  } catch (error: any) {
    log(`Transaction search error for user ${req.user?.id}: ${error.message}`);
    res.status(500).json({
      message: 'Failed to search transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Fraud detection endpoint for high-risk transactions
export const getHighRiskTransactions = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only admins can access fraud detection endpoint
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    // Define high-risk filters
    const highRiskFilters: any = {
      amount_min: 10000,  // Large transactions
      created_hours_ago: 24, // Recent activity
      page: 1,
      limit: 50,
      sort: '-amount'
    };

    // Execute high-risk search
    const result = await transactionService.searchTransactions(highRiskFilters, undefined);

    // Add fraud detection metadata
    const response = {
      ...result,
      fraudAlert: {
        riskLevel: 'HIGH',
        criteria: 'Large transactions in last 24 hours',
        recommendedAction: 'Manual review required',
        alertGeneratedAt: new Date().toISOString()
      }
    };

    log(`High-risk transaction alert generated by ${req.user.email}: ${result.pagination.totalTransactions} transactions found`);

    res.status(200).json(response);

  } catch (error: any) {
    log(`High-risk transaction search error: ${error.message}`);
    res.status(500).json({
      message: 'Failed to get high-risk transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};