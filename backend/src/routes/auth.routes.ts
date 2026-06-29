import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { authController } from '../controllers/auth.controller';
import { validateRegisterInput, validateLoginInput } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { config } from '../config';
import { AuthTokens } from '../services/jwt.service';

const router = Router();

// POST /api/auth/register - User registration
router.post('/auth/register', validateRegisterInput, (req, res, next) => {
  authController.register(req, res, next);
});

// GET /api/auth/verify-email - Email verification
router.get('/auth/verify-email', (req, res, next) => {
  authController.verifyEmail(req, res, next);
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

// POST /api/auth/reset-password - Reset password with token
router.post('/auth/reset-password', (req, res, next) => {
  authController.resetPassword(req, res, next);
});

// POST /api/auth/logout - Logout (invalidate session)
router.post('/auth/logout', authMiddleware, (req, res, next) => {
  authController.logout(req, res, next);
});

// GET /api/auth/google - Initiate Google OAuth
router.get('/auth/google', passport.authenticate('google', { session: false, scope: ['profile', 'email'] }));

// GET /api/auth/google/callback - Google OAuth callback
router.get('/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }),
  (req: Request, res: Response) => {
    const tokens = req.user as unknown as AuthTokens;
    // Redirect to frontend with tokens in query params
    res.redirect(`${config.oauth.callbackUrl}?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }
);

// GET /api/auth/facebook - Initiate Facebook OAuth
router.get('/auth/facebook', passport.authenticate('facebook', { session: false, scope: ['email'] }));

// GET /api/auth/facebook/callback - Facebook OAuth callback
router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/auth/login' }),
  (req: Request, res: Response) => {
    const tokens = req.user as unknown as AuthTokens;
    res.redirect(`${config.oauth.callbackUrl}?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  }
);

export default router;
