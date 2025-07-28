import { Router } from "express";

// Import controller function
import {
  getAllTransactions,
  createTransaction,
  getTransactionById,
  updateTransaction,
  deleteTransaction } from "../controllers/transactionController";

// Import validation middleware
import { 
  validateTransaction,
  checkTransactionExists
 } from "../middlewares/validateTransaction";

// Router instance
const router = Router();

// Route for transactions
router.get('/', getAllTransactions);

// Router to create transaction
router.post('/', validateTransaction, createTransaction);

// Router to get transaction by it Id
router.get('/:id', getTransactionById);

// Router to update transaction by it id
router.put('/:id', checkTransactionExists, validateTransaction, updateTransaction);

// Router to ddelete transaction by it id
router.delete('/:id', deleteTransaction)

// Export router
export default router;