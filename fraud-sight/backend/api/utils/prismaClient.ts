// Import the PrismaClient from the Prisma package
import { PrismaClient }  from '../../generated/prisma';

// Initialize prisma
// This creates a new instance of the PrismaClient
export const prisma = new PrismaClient();