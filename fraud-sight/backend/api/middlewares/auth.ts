import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { redis } from '../../redis/redisClient';

dotenv.config();

// JWT payload interface
interface JWTPayload {
  id: number;
  email: string;
  role: string;
}

// JWT authentication middleware
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  // Extract token from Bearer header
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token format' });
  }

  // Check if the token is blacklisted
  try {
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Unauthorized: Token has been revoked' });
    }
  } catch (redisError) {
    console.warn('Redis blacklist check failed:', redisError);
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};