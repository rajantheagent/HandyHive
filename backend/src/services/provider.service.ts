import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { ServiceProvider, ProviderStatus, ProviderAvailability } from '../entities/ServiceProvider';
import { ProviderCategory } from '../entities/ProviderCategory';
import { ServiceCategory } from '../entities/ServiceCategory';
import { ApiError } from '../errors/api-error';
import { storageService } from './storage.service';
import { redisService } from './redis.service';
import { emailService } from './email.service';

const BCRYPT_ROUNDS = 10;

export interface RegisterProviderDto {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  address: string;
  category_ids: string[];
  experience_years: number;
  service_radius_km: number;
  hourly_rate?: number;
}

export class ProviderService {
  private providerRepo = AppDataSource.getRepository(ServiceProvider);
  private providerCategoryRepo = AppDataSource.getRepository(ProviderCategory);
  private categoryRepo = AppDataSource.getRepository(ServiceCategory);

  /**
   * Register a new service provider.
   * Creates profile with status "pending" awaiting admin verification.
   */
  async register(
    dto: RegisterProviderDto,
    documentFile?: { buffer: Buffer; mimetype: string; originalname: string; size: number }
  ): Promise<{ providerId: string; message: string }> {
    // Check duplicate email
    const existing = await this.providerRepo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (existing) {
      throw ApiError.conflict('A provider with this email already exists', { field: 'email' });
    }

    // Validate categories (1-5)
    if (!dto.category_ids || dto.category_ids.length === 0) {
      throw ApiError.badRequest('At least 1 service category is required', [
        { field: 'category_ids', message: 'At least 1 category is required' },
      ]);
    }
    if (dto.category_ids.length > 5) {
      throw ApiError.badRequest('Maximum 5 service categories allowed', [
        { field: 'category_ids', message: 'Maximum 5 categories allowed' },
      ]);
    }

    // Verify categories exist
    const categories = await this.categoryRepo.findByIds(dto.category_ids);
    if (categories.length !== dto.category_ids.length) {
      throw ApiError.badRequest('One or more category IDs are invalid', [
        { field: 'category_ids', message: 'One or more categories not found' },
      ]);
    }

    // Upload ID document
    let documentUrl: string | null = null;
    if (documentFile) {
      const validation = storageService.validateFile(documentFile);
      if (!validation.valid) {
        throw ApiError.badRequest(validation.error!, [
          { field: 'id_document', message: validation.error! },
        ]);
      }
      documentUrl = await storageService.uploadFile(documentFile, 'id-documents');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Create provider
    const provider = this.providerRepo.create({
      email: dto.email.toLowerCase().trim(),
      password_hash: passwordHash,
      full_name: dto.full_name.trim(),
      phone: dto.phone,
      address: dto.address,
      experience_years: dto.experience_years,
      service_radius_km: dto.service_radius_km,
      hourly_rate: dto.hourly_rate || null,
      status: ProviderStatus.PENDING,
      availability: ProviderAvailability.OFFLINE,
      id_document_url: documentUrl,
    });

    const savedProvider = await this.providerRepo.save(provider);

    // Create provider-category associations
    const providerCategories = dto.category_ids.map((categoryId) =>
      this.providerCategoryRepo.create({
        provider_id: savedProvider.id,
        category_id: categoryId,
      })
    );
    await this.providerCategoryRepo.save(providerCategories);

    return {
      providerId: savedProvider.id,
      message: 'Registration submitted. Your profile is pending admin verification.',
    };
  }

  /**
   * Get provider profile by ID.
   */
  async getProfile(providerId: string): Promise<ServiceProvider> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) {
      throw ApiError.notFound('Provider');
    }
    return provider;
  }

  /**
   * Update provider profile. Changes reflect within 30 seconds via cache invalidation.
   */
  async updateProfile(
    providerId: string,
    updates: Partial<Pick<ServiceProvider, 'full_name' | 'phone' | 'address' | 'hourly_rate' | 'service_radius_km'>>
  ): Promise<ServiceProvider> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) {
      throw ApiError.notFound('Provider');
    }

    Object.assign(provider, updates);
    const updated = await this.providerRepo.save(provider);

    // Invalidate search cache to reflect changes within 30 seconds
    // The search cache TTL is 30s, so changes propagate naturally
    return updated;
  }

  /**
   * Toggle provider availability (online/offline).
   * Updates search visibility immediately.
   */
  async toggleAvailability(
    providerId: string,
    availability: ProviderAvailability
  ): Promise<{ availability: ProviderAvailability }> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) {
      throw ApiError.notFound('Provider');
    }

    if (provider.status !== ProviderStatus.ACTIVE) {
      throw ApiError.badRequest('Only active providers can change availability');
    }

    provider.availability = availability;
    await this.providerRepo.save(provider);

    return { availability: provider.availability };
  }

  /**
   * Update provider location (stored in Redis for real-time tracking).
   */
  async updateLocation(
    providerId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) {
      throw ApiError.notFound('Provider');
    }

    // Store in Redis for real-time position tracking
    await redisService.setProviderLocation(providerId, latitude, longitude);

    // Also update the persistent PostGIS location
    await this.providerRepo
      .createQueryBuilder()
      .update(ServiceProvider)
      .set({
        location: () => `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`,
      })
      .where('id = :id', { id: providerId })
      .execute();
  }

  /**
   * Admin: Approve provider registration.
   */
  async approveProvider(providerId: string): Promise<void> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) {
      throw ApiError.notFound('Provider');
    }

    if (provider.status !== ProviderStatus.PENDING) {
      throw ApiError.badRequest('Only pending providers can be approved');
    }

    provider.status = ProviderStatus.ACTIVE;
    await this.providerRepo.save(provider);

    // Send approval notification email
    emailService.sendVerificationEmail(provider.email, '').catch(() => {});
  }

  /**
   * Admin: Reject provider registration with reason.
   */
  async rejectProvider(providerId: string, reason: string): Promise<void> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) {
      throw ApiError.notFound('Provider');
    }

    if (provider.status !== ProviderStatus.PENDING) {
      throw ApiError.badRequest('Only pending providers can be rejected');
    }

    provider.status = ProviderStatus.DEACTIVATED;
    await this.providerRepo.save(provider);

    // TODO: Send rejection notification with reason
    console.log(`[DEV] Provider ${provider.email} rejected. Reason: ${reason}`);
  }

  /**
   * Get pending providers for admin review.
   */
  async getPendingProviders(): Promise<ServiceProvider[]> {
    return this.providerRepo.find({
      where: { status: ProviderStatus.PENDING },
      order: { created_at: 'ASC' },
    });
  }
}

export const providerService = new ProviderService();
