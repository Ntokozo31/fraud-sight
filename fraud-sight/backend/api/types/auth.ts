import { Request } from 'express';

// Authenticated interface
export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

// JWT payload interface
export interface JWTPayload {
  id: number;
  email: string;
  role: string;
}