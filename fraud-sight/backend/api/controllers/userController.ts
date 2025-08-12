import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import * as userServices from '../services/userServices';
import { log } from '../utils/logger';

dotenv.config();

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