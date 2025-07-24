import { Router } from "express";

// Import controller function
import { getAllTransactions, createTransaction } from "../controllers/transactionController";

// Router instance
const router = Router();

// Route for transactions
router.get('/', getAllTransactions) 

router.post('/', createTransaction)

// Export router
export default router;