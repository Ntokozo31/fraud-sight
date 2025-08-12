import { Router } from 'express';
import * as transactionController from '../controllers/transactionController';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/rbac';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// User routes authenticated users can access their own transactions
router.post('/', transactionController.createTransaction);
router.get('/my-transactions', transactionController.getUserTransactions);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

// Admin routes require admin role
router.get('/admin/all', requireAdmin, transactionController.getAllTransactions);

export default router;