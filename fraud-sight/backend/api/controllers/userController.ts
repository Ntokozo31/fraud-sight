import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as userServices from '../services/userServices';
import { log } from '../utils/logger';
import { redis } from '../../redis/redisClient';
import { 
  UpdateUserProfileRequest,
  ChangePasswordRequest,
  AdminUpdateUserRequest,
  UserListQuery
} from '../types/user';

import crypto from 'crypto';
// Create new user controller function
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        message: 'Name, email, and password are required' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Invalid email format' 
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Create user
    const newUserData = await userServices.newUser({ name, email, password, role });
    
    log(`New user created: ${email} with role: ${role || 'customer'}`);
    res.status(201).json({
      id: newUserData.id,
      name: newUserData.name,
      email: newUserData.email,
      role: newUserData.role,
      createdAt: newUserData.createdAt
    });

  } catch (error: any) {
    log(`Error creating user: ${error.message}`);
    
    // Handle specific database errors
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        message: 'Email already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const userLogin = async (req: Request, res: Response) => {
  let email = '';
  
  try {
    const loginData = req.body;
    email = loginData.email;
    const password = loginData.password;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }

    // Authenticate user
    const user = await userServices.loginUser({ email, password });
    
    // Update last login time
    await userServices.updateLastLogin(user.id);
    
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Create JWT token with all required fields
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        role: user.role 
      }, 
      secret, 
      { expiresIn: '1h' }
    );

    log(`User login successful: ${email}`);
    res.status(200).json({ 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error: any) {
    log(`Login error for ${email || 'unknown'}: ${error.message}`);
    
    // Handle authentication errors
    if (error.message.includes('Invalid credentials') || error.message.includes('User not found')) {
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Get current user profile
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const userProfile = await userServices.getUserProfile(userId);

    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }

    log(`User ${userId} retrieved their profile`);
    res.status(200).json(userProfile);

  } catch (error: any) {
    log(`Error retrieving user profile: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to retrieve profile' 
    });
  }
};

// Update current user profile
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { name, email }: UpdateUserProfileRequest = req.body;

    // Input validation
    if (!name && !email) {
      return res.status(400).json({ 
        message: 'At least one field (name or email) is required' 
      });
    }

    // Email format validation if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: 'Invalid email format' 
        });
      }
    }

    // Name validation if provided
    if (name && (name.trim().length < 2 || name.trim().length > 50)) {
      return res.status(400).json({ 
        message: 'Name must be between 2 and 50 characters' 
      });
    }

    const updatedProfile = await userServices.updateUserProfile(userId, { name, email });

    if (!updatedProfile) {
      return res.status(404).json({ message: 'User not found' });
    }

    log(`User ${userId} updated their profile`);
    res.status(200).json(updatedProfile);

  } catch (error: any) {
    log(`Error updating user profile: ${error.message}`);
    
    if (error.message.includes('Email already exists')) {
      return res.status(409).json({ 
        message: 'Email already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update profile' 
    });
  }
};

// Change user password
export const changeUserPassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword }: ChangePasswordRequest = req.body;

    // Input validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        message: 'Current password, new password, and confirmation are required' 
      });
    }

    // Password confirmation check
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        message: 'New password and confirmation do not match' 
      });
    }

    // Password strength validation
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      });
    }

    // Password cannot be the same as current
    if (currentPassword === newPassword) {
      return res.status(400).json({ 
        message: 'New password must be different from current password' 
      });
    }

    const success = await userServices.changeUserPassword(userId, currentPassword, newPassword);

    if (success) {
      log(`User ${userId} changed their password`);
      res.status(200).json({ 
        message: 'Password changed successfully' 
      });
    }

  } catch (error: any) {
    log(`Error changing password for user ${req.user?.id}: ${error.message}`);
    
    if (error.message.includes('Current password is incorrect')) {
      return res.status(400).json({ 
        message: 'Current password is incorrect' 
      });
    }
    
    if (error.message.includes('User not found')) {
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to change password' 
    });
  }
};

// Get user statistics 
export const getUserStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const statistics = await userServices.getUserStatistics(userId);

    if (!statistics) {
      return res.status(404).json({ message: 'User not found' });
    }

    log(`User ${userId} retrieved their statistics`);
    res.status(200).json(statistics);

  } catch (error: any) {
    log(`Error retrieving user statistics: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to retrieve statistics' 
    });
  }
};



// Get all users: admin 
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Parse query parameters
    const query: UserListQuery = {
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 10, 100),
      role: req.query.role as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      search: req.query.search as string
    };

    const result = await userServices.getAllUsers(query);

    log(`Admin ${req.user.id} retrieved users list (page ${query.page})`);
    res.status(200).json(result);

  } catch (error: any) {
    log(`Error retrieving users list: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to retrieve users' 
    });
  }
};

// Get any user profile: admin only
export const getAnyUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const targetUserId = parseInt(req.params.userId);
    
    if (isNaN(targetUserId)) {
      return res.status(400).json({ 
        message: 'Invalid user ID' 
      });
    }

    const userProfile = await userServices.getUserProfile(targetUserId);

    if (!userProfile) {
      return res.status(404).json({ message: 'User not found' });
    }

    log(`Admin ${req.user.id} accessed profile of user ${targetUserId}`);
    res.status(200).json(userProfile);

  } catch (error: any) {
    log(`Error retrieving user profile: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to retrieve user profile' 
    });
  }
};

// Update any user: admin only
export const adminUpdateUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const targetUserId = parseInt(req.params.userId);
    
    if (isNaN(targetUserId)) {
      return res.status(400).json({ 
        message: 'Invalid user ID' 
      });
    }

    const { name, email, role, isActive }: AdminUpdateUserRequest = req.body;

    // Input validation
    if (!name && !email && !role && isActive === undefined) {
      return res.status(400).json({ 
        message: 'At least one field must be provided' 
      });
    }

    // Email format validation if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          message: 'Invalid email format' 
        });
      }
    }

    // Role validation if provided
    if (role && !['admin', 'customer'].includes(role)) {
      return res.status(400).json({ 
        message: 'Role must be either "admin" or "customer"' 
      });
    }

    const updatedUser = await userServices.adminUpdateUser(targetUserId, { 
      name, 
      email, 
      role, 
      isActive 
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    log(`Admin ${req.user.id} updated user ${targetUserId}`);
    res.status(200).json(updatedUser);

  } catch (error: any) {
    log(`Error updating user: ${error.message}`);
    
    if (error.message.includes('Email already exists')) {
      return res.status(409).json({ 
        message: 'Email already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to update user' 
    });
  }
};

// Get any user statistics: Admin
export const getAnyUserStatistics = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const targetUserId = parseInt(req.params.userId);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const statistics = await userServices.getUserStatistics(targetUserId)

    if (!statistics) {
      return res.status(400).json({ message: 'User not found' })
    }

    log(`Admin ${req.user.id} (${req.user.email}) accessed statistics for user ${targetUserId}`);
    res.status(200).json(statistics)

  } catch (error: any) {
    log(`Error retrieving user statistics for admin ${req.user?.id}: ${error.message}`);
    res.status(500).json({ message: 'Failed to retrieve user statistics'});
  }
};

// Logout 
export const logout = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    
    await redis.setEx(`blacklist:${token}`, 3600, 'true');
    
    log(`User ${req.user.email} logged out successfully`);
    
    res.status(200).json({ 
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    log(`Logout error for user ${req.user?.id}: ${error.message}`);
    res.status(500).json({ 
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const user = await userServices.getUserByEmail(email)

    if (!user) {
      log(`Password reset requested for non-existent email: ${email}`)
      return res.status(400).json({ message: 'If that email exist, we send reset instructions' })
    }

    // Generate reset password token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Reset token expires time
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000)
    
    await userServices.savePasswordResetToken(user.id, resetToken, resetTokenExpires)

    // Email simulation
    console.log(`
    PASSWORD RESET EMAIL (Simulated)
    To: ${email}
    subject: Reset Your FraudSight Password
    
    Click this link to reset your password:
    http://fraudsight.com/reset-password?token=${resetToken}
    
    This link expires in 15 minutes.`);

    log(`Password reset token generated for user: ${email}`)

    res.status(200).json({
      message: 'If that email exists, we have sent instructions',
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (error: any) {
    log(`Password reset request error: ${error.message}`);
    res.status(500).json({
      message: 'Failed to process reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reset password using token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate body fields
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: 'Token, new password, and confirmation are required'
      });
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: 'Password confirmation does not match'
      });
    }

    // validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user by valid, non-expired reset token
    const user = await userServices.getUserByResetToken(token);

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token
    await userServices.resetUserPassword(user.id, newPassword);

    log(`Password reset completed for user: ${user.email}`);
    res.status(200).json({
      message: 'Password reset successful. You can now log in with your new password',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    log(`Password reset error: ${error.message}`);
    res.status(500).json({
      message: 'Failed to reset password',
      error: process.env.NODE_ENV === 'development' ? error.message: undefined
    });
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token = req.params.token;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await userServices.getUserByVerificationToken(token)
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' })
    }

    if (user.emailVerified) {
      return res.status(200).json({
        message: 'Email already verified',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: true
        }
      })
    }
    await userServices.markEmailAsVerified(user.id);
    log(`Email verified for user: ${user.email}`);
    return res.status(200).json({
      message: 'Email verification successful. Your account is now fully active',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error:any) {
    log(`Email verification error: ${error.message}`)
    return res.status(500).json({ 
      message: 'Failed to verify email',
      error: process.env.NODE_ENV === 'development' ? error.message: undefined
    })
  }
};

// Resend email verification token
export const resendVerification = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if email is already verified
    if (req.user.emailVerified) {
      return res.status(400).json({ 
        message: 'Email is already verified' 
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Save verification token to database
    await userServices.saveEmailVerificationToken(req.user.id, verificationToken);

    // Simulate sending verification email
    console.log(`
    📧 EMAIL VERIFICATION (Simulated)
    To: ${req.user.email}
    Subject: Verify Your fraudSight Account
    
    Click this link to verify your email:
    http://fraudsight.com/verify-email/${verificationToken}
    
    This verification link does not expire.
    
    If you didn't create this account, please ignore this email.
    `);

    log(`Verification email resent to user: ${req.user.email}`);
    
    res.status(200).json({ 
      message: 'Verification email sent. Please check your inbox.',
      
      ...(process.env.NODE_ENV === 'development' && { verificationToken })
    });

  } catch (error: any) {
    log(`Resend verification error for user ${req.user?.id}: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to resend verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};