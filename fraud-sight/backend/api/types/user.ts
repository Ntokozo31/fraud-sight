// User profile response interface
export interface UserProfileResponse {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLoginAt?: Date | null;
  totalTransactions?: number;
  totalAmount?: number;
  emailVerified?: boolean;
}

// Update user profile request interface
export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
}

// Change password request interface
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Admin update user request interface
export interface AdminUpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

// user list query interface
export interface UserListQuery {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  search?: string;
}

// User list response interface
export interface UserListResponse {
  users: UserProfileResponse[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User statistics interface
export interface UserStatistics {
  totalTransactions: number;
  totalAmount: number;
  avgTransactionAmount: number;
  lastTransactionDate?: Date;
  transactionsByType: {
    debit: number;
    credit: number;
  };
}