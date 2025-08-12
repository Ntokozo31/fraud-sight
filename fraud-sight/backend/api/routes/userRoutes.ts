import { Router } from 'express';

// Import createUser controller function
import { createUser, userLogin} from "../controllers/userController";

// Router instance
const router = Router();

// New user router
router.post('/signup', createUser);

// Login user router
router.post('/login', userLogin);


// Export router
export default router

