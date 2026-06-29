import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import providerRoutes from './provider.routes';
import addressRoutes from './address.routes';
import searchRoutes from './search.routes';
import bookingRoutes from './booking.routes';
import ratingRoutes from './rating.routes';
import paymentRoutes from './payment.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import userRoutes from './user.routes';

const router = Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use(providerRoutes);
router.use(addressRoutes);
router.use(searchRoutes);
router.use(bookingRoutes);
router.use(ratingRoutes);
router.use(paymentRoutes);
router.use(notificationRoutes);
router.use(adminRoutes);
router.use(userRoutes);

export default router;
