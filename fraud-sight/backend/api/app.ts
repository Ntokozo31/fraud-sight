import express, { Application } from 'express';

//import { Request, Response } from 'express';

// Import cors
import cors from 'cors';

// Import helmet
import helmet from 'helmet';

// Import hpp
import hpp from 'hpp';

// Import rateLimit
import rateLimit from 'express-rate-limit';

// Import router
import transactionsRouter from './routes/transactionRoutes';
import usersRouter from './routes/userRoutes'

// Import swaggerUi
import swaggerUi from 'swagger-ui-express';

// import swaggerDocument
import swaggerDocument  from '../../docs/swagger.json';

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

// HPP middleware
app.use(hpp());

// Security headers
app.use(helmet());

// Helmet middleware
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));

// Helmet frameguard middleware
app.use(helmet.frameguard({ action: 'deny' }));


app.use((req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Cors middleware
app.use(cors({
  origin: ['', ''],
  credentials: true
}));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many request from this IP Adress, please try again later'
});

// Limit requests 
app.use(limiter);

// Health Router
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timeStamp: new Date().toISOString() })
});

// Transaction router
app.use('/api/transactions', transactionsRouter);

// User router
app.use('/api/users',usersRouter);

// Error handler middleware
app.use(errorHandler);

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Start the server
if(require.main === module) {
  app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  });
}

// Export app
export default app;
