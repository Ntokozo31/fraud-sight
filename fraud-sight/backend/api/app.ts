import express, { Application } from 'express';

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

// Import middlewares
import { errorHandler } from './middlewares/errorHandler';
import { authMiddleware } from './middlewares/auth';

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
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [''];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
