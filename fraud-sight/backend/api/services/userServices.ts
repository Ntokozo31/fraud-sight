import { prisma } from '../utils/prismaClient';
import bcrypt from 'bcrypt';

// Create new user service function
export const newUser = async (userData: { 
  name: string; 
  email: string; 
  password: string; 
  role?: string; 
}) => {
  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

  // Create user with hashed password
  const user = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role || 'customer'
    }
  });

  return user;
};

export const loginUser = async (loginData: { email: string; password: string }) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: loginData.email.toLowerCase() }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
  
  if (!isPasswordValid) {
    throw new Error('Invalid credentials');
  }

  return user;
};