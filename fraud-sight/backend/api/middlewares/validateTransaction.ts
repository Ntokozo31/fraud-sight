// Import Request, Response, and NextFunction from express
import { Request, Response, NextFunction } from 'express';

// Import transactionService
import * as transactionService from '../services/transactionService';

// validation
export const validateTransaction = (req: Request, res: Response, next: NextFunction) => {
  const { amount, type } = req.body;
  if(!amount || !type) {
    return res.status(400).json({ message: 'amount and type are required'});
  }
  next();
};

// Check if Transaction exists
export const checkTransactionExists = async (req: Request, res: Response, next: NextFunction) => {
  const id = Number(req.params.id);
  const userId = Number(req.user?.id);
  const transaction = await transactionService.getTransactionById(id, userId, req.body);
  if (!transaction) {
    return res.status(404).json({ message: 'No transaction found' });
  }
  next();
};