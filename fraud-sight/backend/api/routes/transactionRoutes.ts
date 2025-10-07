import { Router } from 'express';
import * as transactionController from '../controllers/transactionController';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/rbac';
import { transactionSearchSchema } from '../validation/transactionSchema';
import { validateQuery } from '../middlewares/validationMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// User routes authenticated users can access their own transactions
router.post('/', transactionController.createTransaction);
router.get('/my-transactions', transactionController.getUserTransactions);
router.get('/:id', transactionController.getTransactionById);
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

// search and fraud detection
router.get('/search', validateQuery(transactionSearchSchema), transactionController.searchTransactions);
router.get('/fraud/high-risk', requireAdmin, transactionController.getHighRiskTransactions);

// Admin routes require admin role
router.get('/admin/all', requireAdmin, transactionController.getAllTransactions);

export default router;