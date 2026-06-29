import { Request, Response, NextFunction } from 'express';
import { addressService } from '../services/address.service';
import { getTokenPayload } from '../middleware/auth.middleware';
import { ApiError } from '../errors/api-error';
import { AddressLabel } from '../entities/Address';

export class AddressController {
  /**
   * GET /api/addresses
   * Get all saved addresses for the current user.
   */
  async getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const addresses = await addressService.getUserAddresses(payload.userId);
      res.status(200).json(addresses);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/addresses
   * Save a new address.
   */
  async createAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const { full_address, label, latitude, longitude, is_default } = req.body;

      if (!full_address) {
        throw ApiError.badRequest('Full address is required');
      }

      const validLabels = Object.values(AddressLabel);
      if (label && !validLabels.includes(label)) {
        throw ApiError.badRequest(`Label must be one of: ${validLabels.join(', ')}`);
      }

      const address = await addressService.createAddress(payload.userId, {
        full_address,
        label: label || AddressLabel.HOME,
        latitude,
        longitude,
        is_default,
      });

      res.status(201).json(address);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/addresses/:id
   * Update an existing address.
   */
  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const addressId = req.params.id as string;
      const { full_address, label, latitude, longitude, is_default } = req.body;

      const address = await addressService.updateAddress(payload.userId, addressId, {
        full_address,
        label,
        latitude,
        longitude,
        is_default,
      });

      res.status(200).json(address);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/addresses/:id
   * Delete a saved address.
   */
  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = getTokenPayload(req);
      const addressId = req.params.id as string;
      await addressService.deleteAddress(payload.userId, addressId);
      res.status(200).json({ message: 'Address deleted' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/geocode
   * Geocode an address string to coordinates.
   */
  async geocode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { address } = req.body;
      if (!address) {
        throw ApiError.badRequest('Address string is required');
      }
      const result = await addressService.geocode(address);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/reverse-geocode
   * Reverse geocode coordinates to an address.
   */
  async reverseGeocode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { latitude, longitude } = req.body;
      if (latitude === undefined || longitude === undefined) {
        throw ApiError.badRequest('Latitude and longitude are required');
      }
      const result = await addressService.reverseGeocode(latitude, longitude);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/autocomplete?input=xxx
   * Address autocomplete. Returns suggestions for 3+ chars, empty for fewer.
   */
  async autocomplete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.query.input as string || '';
      const suggestions = await addressService.autocomplete(input);
      res.status(200).json(suggestions);
    } catch (error) {
      next(error);
    }
  }
}

export const addressController = new AddressController();
