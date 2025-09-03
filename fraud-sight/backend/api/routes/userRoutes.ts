import { Router } from 'express';
import { createUser, userLogin} from "../controllers/userController";
import * as userController from '../controllers/userController';
import { authMiddleware } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/rbac';
import { validateBody, validateParams, validateQuery } from '../middlewares/validationMiddleware';
import { userRegistrationSchema, userLoginSchema, userIdParamSchema, updateProfileSchema, changePasswordSchema, userListQuerySchema } from '../validation/userSchemas';


// Router instance
const router = Router();

// New user router
router.post('/signup', validateBody(userRegistrationSchema), createUser);

// Router login
router.post('/login', validateBody(userLoginSchema), userLogin);

// Router get profile
router.get('/profile', authMiddleware, userController.getUserProfile);

// Router update profile
router.put('/profile', authMiddleware, validateBody(updateProfileSchema), userController.updateUserProfile);

// Router change password
router.post('/change-password', authMiddleware, validateBody(changePasswordSchema), userController.changeUserPassword);

// Router get statistics
router.get('/statistics', authMiddleware, userController.getUserStatistics);

// Router logout
router.post('/logout', authMiddleware, userController.logout);

// Router forgot password
router.post('/forgot-password', userController.requestPasswordReset);

// Router reset password
router.post('/reset-password', userController.resetPassword);

// Router get users: Admin
router.get('/admin/users', authMiddleware, requireAdmin, validateQuery(userListQuerySchema), userController.getAllUsers);

// Router get user: Admin
router.get('/admin/user/:userId', authMiddleware, requireAdmin, validateParams(userIdParamSchema), userController.getAnyUserProfile);

// Router update user: Admin
router.put('/admin/user/:userId', authMiddleware, requireAdmin, validateParams(userIdParamSchema), userController.adminUpdateUser);

// Router get user statistics
router.get('/admin/user/:userId/statistics', authMiddleware, requireAdmin, validateParams(userIdParamSchema), userController.getAnyUserStatistics);

// Export router
export default router;