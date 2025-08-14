import { Router } from 'express';
import { createUser, userLogin} from "../controllers/userController";
import * as userController from '../controllers/userController';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/rbac';
import { getUserStatistics } from '../services/userServices';


// Router instance
const router = Router();

// New user router
router.post('/signup', createUser);

// Router login
router.post('/login', userLogin);

// Router get profile
router.get('/profile', authMiddleware, userController.getUserProfile);

// Router update profile
router.put('/profile', authMiddleware, userController.updateUserProfile);

// Router change password
router.post('/change-password', authMiddleware, userController.changeUserPassword);

// Router get statistics
router.get('/statistics', authMiddleware, userController.getUserStatistics);

// Router get users: Admin
router.get('/admin/users', authMiddleware, requireAdmin, userController.getAllUsers);

// Router get user: Admin
router.get('/admin/user/:userId', authMiddleware, requireAdmin, userController.getAnyUserProfile);

// Router update user: Admin
router.put('/admin/user/:userId', authMiddleware, requireAdmin, userController.adminUpdateUser);

// Router get user statistics
router.get('/admin/user/:userId/statistics', authMiddleware, requireAdmin, userController.getAnyUserStatistics)

// Export router
export default router

