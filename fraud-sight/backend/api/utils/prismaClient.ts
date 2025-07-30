// Import the PrismaClient from the Prisma package
import { PrismaClient }  from '../../generated/prisma';

// Import the dotenv package to load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Get the database URL from environment variables
const dbUrl = process.env.DATABASE_URL;

// Initialize prisma
// This creates a new instance of the PrismaClient
export const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });