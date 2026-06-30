import { AppDataSource } from '../config/data-source';
import { ServiceProvider, ProviderStatus, ProviderAvailability } from '../entities/ServiceProvider';
import { redisService, SEARCH_CACHE_TTL, RedisKeys } from './redis.service';
import crypto from 'crypto';

export interface SearchProvidersDto {
  latitude: number;
  longitude: number;
  categoryId?: string;
  radiusKm?: number;  // default 10, max 25, increment 5
  filters?: {
    minRating?: number;
    priceMin?: number;
    priceMax?: number;
    availableNow?: boolean;
  };
  sortBy?: 'distance' | 'rating' | 'price';
  limit?: number; // max 50
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
  categories?: string[];
}

export interface SearchResult {
  providers: ProviderSummary[];
  total: number;
  radius_km: number;
}

export class SearchService {
  private providerRepo = AppDataSource.getRepository(ServiceProvider);

  /**
   * Search for providers within a radius using PostGIS ST_DWithin.
   * Results are cached in Redis for 30 seconds.
   * Max 50 results, sorted by distance ascending by default.
   */
  async searchProviders(dto: SearchProvidersDto): Promise<SearchResult> {
    const radiusKm = Math.min(dto.radiusKm || 10, 25);
    const radiusMeters = radiusKm * 1000;
    const limit = Math.min(dto.limit || 50, 50);
    const offset = dto.offset || 0;
    const sortBy = dto.sortBy || 'distance';

    // Generate cache key
    const cacheHash = this.generateCacheHash(dto);
    const cached = await redisService.getSearchCache(cacheHash);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
    // Build PostGIS query
    let query = this.providerRepo
      .createQueryBuilder('sp')
      .select([
        'sp.id',
        'sp.full_name',
        'sp.email',
        'sp.phone',
        'sp.hourly_rate',
        'sp.average_rating',
        'sp.total_ratings',
        'sp.total_bookings',
        'sp.availability',
      ])
      .addSelect(
        `ST_Distance(sp.location::geography, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography)`,
        'distance_meters'
      )
      .where('sp.status = :status', { status: ProviderStatus.ACTIVE })
      .andWhere('sp.availability = :availability', { availability: ProviderAvailability.ONLINE })
      .andWhere('sp.location IS NOT NULL')
      .andWhere(
        `ST_DWithin(sp.location::geography, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radius)`,
      )
      .setParameter('latitude', dto.latitude)
      .setParameter('longitude', dto.longitude)
      .setParameter('radius', radiusMeters);

    // Category filter
    if (dto.categoryId) {
      query = query
        .innerJoin('provider_categories', 'pc', 'pc.provider_id = sp.id')
        .andWhere('pc.category_id = :categoryId', { categoryId: dto.categoryId });
    }

    // Conjunctive filters (AND logic)
    if (dto.filters) {
      if (dto.filters.minRating !== undefined && dto.filters.minRating > 0) {
        query = query.andWhere('sp.average_rating >= :minRating', { minRating: dto.filters.minRating });
      }
      if (dto.filters.priceMin !== undefined) {
        query = query.andWhere('sp.hourly_rate >= :priceMin', { priceMin: dto.filters.priceMin });
      }
      if (dto.filters.priceMax !== undefined) {
        query = query.andWhere('sp.hourly_rate <= :priceMax', { priceMax: dto.filters.priceMax });
      }
    }

    // Sorting
    switch (sortBy) {
      case 'rating':
        query = query.orderBy('sp.average_rating', 'DESC');
        break;
      case 'price':
        query = query.orderBy('sp.hourly_rate', 'ASC');
        break;
      case 'distance':
      default:
        query = query.orderBy('distance_meters', 'ASC');
        break;
    }

    // Get total count before pagination
    const total = await query.getCount();

    // Apply pagination
    query = query.limit(limit).offset(offset);

    const rawResults = await query.getRawMany();

    const providers: ProviderSummary[] = rawResults.map((row) => ({
      id: row.sp_id,
      full_name: row.sp_full_name,
      email: row.sp_email,
      phone: row.sp_phone,
      hourly_rate: row.sp_hourly_rate ? parseFloat(row.sp_hourly_rate) : null,
      average_rating: parseFloat(row.sp_average_rating) || 0,
      total_ratings: row.sp_total_ratings || 0,
      total_bookings: row.sp_total_bookings || 0,
      distance_km: parseFloat((row.distance_meters / 1000).toFixed(2)),
      eta_minutes: Math.round((row.distance_meters / 1000) * 3), // Rough ETA: ~3 min/km
      availability: row.sp_availability,
    }));

    const result: SearchResult = {
      providers,
      total,
      radius_km: radiusKm,
    };

    // Cache results for 30 seconds
    await redisService.setSearchCache(cacheHash, JSON.stringify(result));

    return result;

    } catch (error) {
      console.error('[Search] Query failed:', error);
      // Return empty results instead of crashing
      return { providers: [], total: 0, radius_km: radiusKm };
    }
  }

  /**
   * Get detailed provider profile by ID.
   */
  async getProviderDetails(providerId: string): Promise<ServiceProvider | null> {
    return this.providerRepo.findOne({ where: { id: providerId } });
  }

  /**
   * Generate a cache hash from search parameters.
   */
  private generateCacheHash(dto: SearchProvidersDto): string {
    const keyData = JSON.stringify({
      lat: Math.round(dto.latitude * 1000) / 1000, // Round to ~100m precision
      lng: Math.round(dto.longitude * 1000) / 1000,
      cat: dto.categoryId,
      r: dto.radiusKm || 10,
      f: dto.filters,
      s: dto.sortBy || 'distance',
      l: dto.limit || 50,
      o: dto.offset || 0,
    });
    return crypto.createHash('md5').update(keyData).digest('hex');
  }
}

export const searchService = new SearchService();
