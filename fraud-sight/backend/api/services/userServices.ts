import { prisma } from '../utils/prismaClient';
import bcrypt from 'bcrypt';
import { 
  UserProfileResponse,
  UpdateUserProfileRequest,
  AdminUpdateUserRequest,
  UserListQuery,
  UserListResponse,
  UserStatistics,
} from '../types/user';

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

// Get user profile with statistics
export const getUserProfile = async (userId: number): Promise<UserProfileResponse | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        select: {
          amount: true,
          type: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  // Calculate statistics
  const totalTransactions = user.transactions.length;
  const totalAmount = user.transactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    totalTransactions,
    totalAmount
  };
};

// Update user profile
export const updateUserProfile = async (
  userId: number,
  updateData: UpdateUserProfileRequest
): Promise<UserProfileResponse | null> => {
  // Check if email is being changed and if its already taken
  if (updateData.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: updateData.email }
    });

    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email already exists')
    }
  }

  const updateUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...updateData,
      email: updateData.email?.toLocaleLowerCase(),
      updatedAt: new Date()
    },
    include: {
      transactions: {
        select: {
          amount: true,
          type: true
        }
      }
    }
  });

  // Calculate statistics
  const totalTransactions = updateUser.transactions.length;
  const totalAmount = updateUser.transactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    id: updateUser.id,
    name: updateUser.name,
    email: updateUser.email,
    role: updateUser.role,
    createdAt: updateUser.createdAt,
    updatedAt: updateUser.updatedAt,
    isActive: updateUser.isActive,
    lastLoginAt: updateUser.lastLoginAt,
    totalTransactions,
    totalAmount
  }
}

