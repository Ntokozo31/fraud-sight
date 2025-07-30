// Import createClient from redis
import { createClient } from 'redis';

// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// Get the Redis URL from environment variables
const redisUrl = process.env.REDIS_URL;

// Create a Redis client
export const redis = createClient({ url: redisUrl });

// Connect to Redis
redis.connect();