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
      email: updateData.email?.toLowerCase(),
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

// Change user password
export const changeUserPassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> => {
  // User with current password
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const saltRounds = 10;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedNewPassword,
      updatedAt: new Date()
    }
  });

  return true;
};

// Update last login time
export const updateLastLogin = async (userId: number): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date()
    }
  });
};

// Admin: Get all users with pagination and filters
export const getAllUsers = async (query: UserListQuery): Promise<UserListResponse> => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {};
  if (query.role) {
    where.role = query.role;
  }
  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  // Get users with transaction counts
  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        transactions: {
          select: {
            amount: true,
            type: true
          }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  // Formatting response with statistics
  const formattedUsers: UserProfileResponse[] = users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    totalTransactions: user.transactions.length,
    totalAmount: user.transactions.reduce((sum, t) => sum + t.amount, 0)
  }));

  const totalPages = Math.ceil(totalUsers / limit);

  return {
    users: formattedUsers,
    pagination: {
      currentPage: page,
      totalPages,
      totalUsers,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

// Admin: Update any user
export const adminUpdateUser = async (
  targetUserId: number,
  updateData: AdminUpdateUserRequest
): Promise<UserProfileResponse | null> => {
  // Check if email is being changed and if it's already taken
  if (updateData.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: updateData.email }
    });
    
    if (existingUser && existingUser.id !== targetUserId) {
      throw new Error('Email already exists');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      ...updateData,
      email: updateData.email?.toLowerCase(),
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
  const totalTransactions = updatedUser.transactions.length;
  const totalAmount = updatedUser.transactions.reduce((sum, t) => sum + t.amount, 0);

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
    isActive: updatedUser.isActive,
    lastLoginAt: updatedUser.lastLoginAt,
    totalTransactions,
    totalAmount
  };
};

// Get details user statistics
export const getUserStatistics = async (userId: number): Promise<UserStatistics | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    return null;
  }

  const transactions = user.transactions;
  const totalTransactions = transactions.length;
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const avgTransactionAmount = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
  const lastTransactionDate = transactions.length > 0 ? transactions[0].createdAt : undefined;

  const transactionsByType = transactions.reduce(
    (acc, t) => {
      acc[t.type as 'debit' | 'credit']++;
      return acc;
    },
    { debit: 0, credit: 0 }
  );

  return {
    totalTransactions,
    totalAmount,
    avgTransactionAmount,
    lastTransactionDate,
    transactionsByType
  };
};

// Get user by email for password reset
export const getUserByEmail = async (email: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase()
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });
    return user;
  } catch (error) {
    console.error('Error finding user by email:', error);
    throw new Error('Database error while finding user');
  }
};

// Save password reset token
export const savePasswordResetToken = async (userId: number, resetToken: string, expiresAt: Date) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: resetToken,
        resetTokenExpires: expiresAt
      }
    })
    return true;
  } catch (error) {
    console.error('Error saving  reset token:', error);
    throw new Error('Failed to save reset token');
  }
};

// Get user by valid reset token
export const getUserByResetToken = async (resetToken: string) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: resetToken,
        resetTokenExpires: {
          gt: new Date()
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        resetToken: true,
        resetTokenExpires: true
      }
    })
    return user;
  } catch (error) {
    console.error('Error finding user by reset token:', error);
    throw new Error('Database error while validating reset token');
  }
};

// Reset user password and clear token
export const resetUserPassword = async (userId: number, newPassword: string) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
        updatedAt: new Date()
      }
    });
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw new Error('Failed to reset password');
  }
};


