import express, { Application } from 'express';

// Import router
import transactionsRouter from './routes/transactionRoutes';

// Import error handler middleware
import { errorHandler } from './middlewares/errorHandler';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Create the Express app instance
const app: Application = express();

const PORT = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(express.json());

// Transcation router
app.use('/api/transactions', transactionsRouter);

// Error handler middleware
app.use(errorHandler);

// Start the server
if(require.main === module) {
  app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
