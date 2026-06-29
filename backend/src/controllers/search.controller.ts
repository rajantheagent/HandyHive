import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service';
import { ApiError } from '../errors/api-error';

export class SearchController {
  /**
   * GET /api/search/providers
   * Search for providers by location, category, and filters.
   */
  async searchProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        latitude, longitude, categoryId,
        radiusKm, minRating, priceMin, priceMax,
        sortBy, limit, offset,
      } = req.query;

      if (!latitude || !longitude) {
        throw ApiError.badRequest('Latitude and longitude are required');
      }

      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        throw ApiError.badRequest('Latitude must be between -90 and 90');
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        throw ApiError.badRequest('Longitude must be between -180 and 180');
      }

      const result = await searchService.searchProviders({
        latitude: lat,
        longitude: lng,
        categoryId: categoryId as string | undefined,
        radiusKm: radiusKm ? parseInt(radiusKm as string, 10) : undefined,
        filters: {
          minRating: minRating ? parseFloat(minRating as string) : undefined,
          priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
          priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
        },
        sortBy: (sortBy as 'distance' | 'rating' | 'price') || 'distance',
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/search/providers/:id
   * Get detailed provider profile.
   */
  async getProviderDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const provider = await searchService.getProviderDetails(id);

      if (!provider) {
        throw ApiError.notFound('Provider');
      }

      res.status(200).json(provider);
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
