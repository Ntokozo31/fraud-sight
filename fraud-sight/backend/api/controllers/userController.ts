import { Request, Response } from 'express';

// Import userService
import * as userServices from '../services/userServices';

// Create new user controller function
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const newUserData = await userServices.newUser({ name, email, password, role })
    res.status(201).json(newUserData)
  } catch (_error) {
    res.status(500).json({ message: 'failed to create Account' })
  }
};

