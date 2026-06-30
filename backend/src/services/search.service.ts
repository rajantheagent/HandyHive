import { AppDataSource } from '../config/data-source';
import { ServiceProvider, ProviderStatus, ProviderAvailability } from '../entities/ServiceProvider';
import { redisService } from './redis.service';
import crypto from 'crypto';

export interface SearchProvidersDto {
  latitude: number;
  longitude: number;
  categoryId?: string;
  radiusKm?: number;
  filters?: {
    minRating?: number;
    priceMin?: number;
    priceMax?: number;
  };
  sortBy?: 'distance' | 'rating' | 'price';
  limit?: number;
  offset?: number;
}

export interface ProviderSummary {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  hourly_rate: number | null;
  average_rating: number;
  total_ratings: number;
  total_bookings: number;
  distance_km: number;
  eta_minutes: number;
  availability: string;
}

export interface SearchResult {
  providers: ProviderSummary[];
  total: number;
  radius_km: number;
}

export class SearchService {
  private providerRepo = AppDataSource.getRepository(ServiceProvider);

  async searchProviders(dto: SearchProvidersDto): Promise<SearchResult> {
    const radiusKm = Math.min(dto.radiusKm || 10, 25);
    const limit = Math.min(dto.limit || 50, 50);
    const offset = dto.offset || 0;

    try {
      // Simple query: find all active providers (show both online and offline)
      let query = this.providerRepo
        .createQueryBuilder('sp')
        .where('sp.status = :status', { status: ProviderStatus.ACTIVE });

      // Category filter
      if (dto.categoryId) {
        query = query
          .innerJoin('provider_categories', 'pc', 'pc.provider_id = sp.id')
          .andWhere('pc.category_id = :categoryId', { categoryId: dto.categoryId });
      }

      // Rating filter
      if (dto.filters?.minRating && dto.filters.minRating > 0) {
        query = query.andWhere('sp.average_rating >= :minRating', { minRating: dto.filters.minRating });
      }
      // Price filters
      if (dto.filters?.priceMin) {
        query = query.andWhere('sp.hourly_rate >= :priceMin', { priceMin: dto.filters.priceMin });
      }
      if (dto.filters?.priceMax) {
        query = query.andWhere('sp.hourly_rate <= :priceMax', { priceMax: dto.filters.priceMax });
      }

      // Sorting
      switch (dto.sortBy) {
        case 'rating': query = query.orderBy('sp.average_rating', 'DESC'); break;
        case 'price': query = query.orderBy('sp.hourly_rate', 'ASC'); break;
        default: query = query.orderBy('sp.created_at', 'DESC'); break;
      }

      const total = await query.getCount();
      const providers = await query.skip(offset).take(limit).getMany();

      // Map to summary with simulated distance (since most won't have GPS)
      const results: ProviderSummary[] = providers.map((sp, idx) => ({
        id: sp.id,
        full_name: sp.full_name,
        email: sp.email,
        phone: sp.phone,
        hourly_rate: sp.hourly_rate ? parseFloat(String(sp.hourly_rate)) : null,
        average_rating: sp.average_rating ? parseFloat(String(sp.average_rating)) : 0,
        total_ratings: sp.total_ratings || 0,
        total_bookings: sp.total_bookings || 0,
        distance_km: parseFloat((1 + idx * 0.5).toFixed(1)), // Simulated until GPS is set
        eta_minutes: Math.round((1 + idx * 0.5) * 3),
        availability: sp.availability,
      }));

      return { providers: results, total, radius_km: radiusKm };

    } catch (error) {
      console.error('[Search] Query failed:', error);
      return { providers: [], total: 0, radius_km: radiusKm };
    }
  }

  async getProviderDetails(providerId: string): Promise<ServiceProvider | null> {
    return this.providerRepo.findOne({ where: { id: providerId } });
  }

  private generateCacheHash(dto: SearchProvidersDto): string {
    return crypto.createHash('md5').update(JSON.stringify(dto)).digest('hex');
  }
}

export const searchService = new SearchService();
