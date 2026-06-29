import { Request, Response, NextFunction } from 'express';
import { providerService } from '../services/provider.service';
import { ApiError } from '../errors/api-error';
import { getTokenPayload } from '../middleware/auth.middleware';
import { ProviderAvailability } from '../entities/ServiceProvider';
import { ValidationFieldError } from '../errors/validation-error';

export class ProviderController {
  /**
   * POST /api/providers/register
   * Register as a new service provider.
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, full_name, phone, address, category_ids, experience_years, service_radius_km, hourly_rate } = req.body;

      // Input validation
      const errors: ValidationFieldError[] = [];

      if (!email) errors.push({ field: 'email', message: 'Email is required' });
      if (!password) errors.push({ field: 'password', message: 'Password is required' });
      if (!full_name || full_name.trim().length < 2 || full_name.trim().length > 100) {
        errors.push({ field: 'full_name', message: 'Full name must be 2-100 characters' });
      }
      if (!phone) errors.push({ field: 'phone', message: 'Phone is required' });
      if (!address) errors.push({ field: 'address', message: 'Address is required' });

      if (experience_years === undefined || experience_years < 0 || experience_years > 50) {
        errors.push({ field: 'experience_years', message: 'Experience must be 0-50 years' });
      }
      if (!service_radius_km || service_radius_km < 1 || service_radius_km > 50) {
        errors.push({ field: 'service_radius_km', message: 'Service radius must be 1-50 km' });
      }

      if (!category_ids || !Array.isArray(category_ids) || category_ids.length === 0) {
        errors.push({ field: 'category_ids', message: 'At least 1 service category is required' });
      } else if (category_ids.length > 5) {
        errors.push({ field: 'category_ids', message: 'Maximum 5 categories allowed' });
      }

      if (errors.length > 0) {
        throw ApiError.badRequest('Validation failed', errors);
      }

      const documentFile = req.file ? {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        size: req.file.size,
      } : undefined;

      const result = await providerService.register(
        { email, password, full_name, phone, address, category_ids, experience_years, service_radius_km, hourly_rate },
        documentFile
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/providers/profile
   * Get current provider's profile.
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const provider = await providerService.getProfile(payload.userId);
      res.status(200).json(provider);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/providers/profile
   * Update provider profile details.
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const { full_name, phone, address, hourly_rate, service_radius_km } = req.body;

      const updates: Record<string, any> = {};
      if (full_name !== undefined) updates.full_name = full_name;
      if (phone !== undefined) updates.phone = phone;
      if (address !== undefined) updates.address = address;
      if (hourly_rate !== undefined) updates.hourly_rate = hourly_rate;
      if (service_radius_km !== undefined) updates.service_radius_km = service_radius_km;

      const provider = await providerService.updateProfile(payload.userId, updates);
      res.status(200).json(provider);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/providers/availability
   * Toggle provider availability (online/offline).
   */
  async toggleAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const { availability } = req.body;

      if (!availability || !Object.values(ProviderAvailability).includes(availability)) {
        throw ApiError.badRequest('Availability must be "online" or "offline"');
      }

      const result = await providerService.toggleAvailability(payload.userId, availability);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/providers/location
   * Update provider's current location.
   */
  async updateLocation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const { latitude, longitude } = req.body;

      if (latitude === undefined || longitude === undefined) {
        throw ApiError.badRequest('Latitude and longitude are required');
      }
      if (latitude < -90 || latitude > 90) {
        throw ApiError.badRequest('Latitude must be between -90 and 90');
      }
      if (longitude < -180 || longitude > 180) {
        throw ApiError.badRequest('Longitude must be between -180 and 180');
      }

      await providerService.updateLocation(payload.userId, latitude, longitude);
      res.status(200).json({ message: 'Location updated' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/providers/:id/approve
   * Admin approves a pending provider.
   */
  async approveProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      await providerService.approveProvider(id);
      res.status(200).json({ message: 'Provider approved' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/admin/providers/:id/reject
   * Admin rejects a pending provider.
   */
  async rejectProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;

      if (!reason || reason.trim().length < 10) {
        throw ApiError.badRequest('Rejection reason must be at least 10 characters');
      }

      await providerService.rejectProvider(id, reason);
      res.status(200).json({ message: 'Provider rejected' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/admin/providers/pending
   * Get all pending provider registrations.
   */
  async getPendingProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const providers = await providerService.getPendingProviders();
      res.status(200).json(providers);
    } catch (error) {
      next(error);
    }
  }
}

export const providerController = new ProviderController();
