import express, { Application } from 'express';

// Import router
import transactionsRouter from './routes/transactionRoutes';

// Create the Express app instance
const app: Application = express();

const PORT = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(express.json());

// Transcation router
app.use('/api/transactions', transactionsRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});