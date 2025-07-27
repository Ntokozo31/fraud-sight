// Import Request, Response, and NextFunction from express
import { Request, Response, NextFunction } from 'express';

// validation
export const validateTransaction = (req: Request, res: Response, next: NextFunction) => {
  const { amount, type } = req.body;
  if(!amount || !type) {
    return res.status(400).json({ message: 'amount and type are required'})
  }
  next();
};