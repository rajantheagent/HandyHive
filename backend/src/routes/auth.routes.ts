import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateRegisterInput, validateLoginInput } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/register - User registration
router.post('/auth/register', validateRegisterInput, (req, res, next) => {
  authController.register(req, res, next);
});

// POST /api/auth/login - User login
router.post('/auth/login', validateLoginInput, (req, res, next) => {
  authController.login(req, res, next);
});

// POST /api/auth/refresh - Refresh access token
router.post('/auth/refresh', (req, res, next) => {
  authController.refreshToken(req, res, next);
});

// POST /api/auth/forgot-password - Request password reset
router.post('/auth/forgot-password', (req, res, next) => {
  authController.forgotPassword(req, res, next);
});

// POST /api/auth/change-password - Direct password change
router.post('/auth/change-password', (req, res, next) => {
  authController.changePassword(req, res, next);
});

// POST /api/auth/reset-password - Reset password with token
router.post('/auth/reset-password', (req, res, next) => {
  authController.resetPassword(req, res, next);
});

// POST /api/auth/logout - Logout
router.post('/auth/logout', authMiddleware, (req, res, next) => {
  authController.logout(req, res, next);
});

export default router;
