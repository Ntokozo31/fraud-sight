import { Router } from 'express';

// Import createUser controller function
import { createUser } from "../controllers/userController";

// Router instance
const router = Router();

// Router to create new user
router.post('/', createUser);

// Export router
export default router

