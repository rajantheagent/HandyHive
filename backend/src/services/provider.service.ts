import bcrypt from 'bcrypt';
import { AppDataSource } from '../config/data-source';
import { ServiceProvider, ProviderStatus, ProviderAvailability } from '../entities/ServiceProvider';
import { ProviderCategory } from '../entities/ProviderCategory';
import { ServiceCategory } from '../entities/ServiceCategory';
import { ApiError } from '../errors/api-error';
import { storageService } from './storage.service';
import { redisService } from './redis.service';

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
   * - Prevents duplicate applications
   * - Creates profile with status "pending"
   */
  async register(
    dto: RegisterProviderDto,
    documentFile?: { buffer: Buffer; mimetype: string; originalname: string; size: number }
  ): Promise<{ providerId: string; message: string }> {
    // Check if already applied (prevent duplicate applications)
    const existing = await this.providerRepo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existing) {
      if (existing.status === ProviderStatus.PENDING) {
        throw ApiError.conflict('Your application is already pending review. Please wait for admin approval.', {
          field: 'email',
          status: 'pending',
        });
      }
      if (existing.status === ProviderStatus.ACTIVE) {
        throw ApiError.conflict('You are already a registered provider.', { field: 'email' });
      }
      // If suspended/deactivated, allow re-application
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

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    // Create provider first to get an ID for the filename
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
    });

    const savedProvider = await this.providerRepo.save(provider);

    // Upload ID document with provider name and ID in filename
    let documentUrl: string | null = null;
    if (documentFile) {
      const validation = storageService.validateFile(documentFile);
      if (!validation.valid) {
        throw ApiError.badRequest(validation.error!, [
          { field: 'id_document', message: validation.error! },
        ]);
      }

      // Rename file: ProviderName_ProviderID.ext
      const safeName = dto.full_name.trim().replace(/[^a-zA-Z0-9]/g, '_');
      const shortId = savedProvider.id.substring(0, 8);
      const ext = documentFile.originalname.split('.').pop() || 'pdf';
      const renamedFile = {
        ...documentFile,
        originalname: `${safeName}_${shortId}.${ext}`,
      };

      documentUrl = await storageService.uploadFile(renamedFile, 'id-documents');
    }

    // Update provider with document URL
    if (documentUrl) {
      savedProvider.id_document_url = documentUrl;
      await this.providerRepo.save(savedProvider);
    }

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
      message: 'Registration submitted successfully! Your application is pending admin verification.',
    };
  }

  /**
   * Check if a user already has a provider application.
   */
  async checkExistingApplication(email: string): Promise<{ exists: boolean; status?: string }> {
    const existing = await this.providerRepo.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return { exists: true, status: existing.status };
    }
    return { exists: false };
  }

  /**
   * Get provider profile by ID.
   */
  async getProfile(providerId: string): Promise<ServiceProvider> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) throw ApiError.notFound('Provider');
    return provider;
  }

  /**
   * Update provider profile.
   */
  async updateProfile(
    providerId: string,
    updates: Partial<Pick<ServiceProvider, 'full_name' | 'phone' | 'address' | 'hourly_rate' | 'service_radius_km'>>
  ): Promise<ServiceProvider> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) throw ApiError.notFound('Provider');
    Object.assign(provider, updates);
    return this.providerRepo.save(provider);
  }

  /**
   * Toggle availability (online/offline).
   */
  async toggleAvailability(
    providerId: string,
    availability: ProviderAvailability
  ): Promise<{ availability: ProviderAvailability }> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) throw ApiError.notFound('Provider');
    if (provider.status !== ProviderStatus.ACTIVE) {
      throw ApiError.badRequest('Only active providers can change availability');
    }
    provider.availability = availability;
    await this.providerRepo.save(provider);
    return { availability: provider.availability };
  }

  /**
   * Update provider location.
   */
  async updateLocation(providerId: string, latitude: number, longitude: number): Promise<void> {
    await redisService.setProviderLocation(providerId, latitude, longitude);
  }

  /**
   * Admin: Approve provider.
   */
  async approveProvider(providerId: string): Promise<void> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) throw ApiError.notFound('Provider');
    if (provider.status !== ProviderStatus.PENDING) {
      throw ApiError.badRequest('Only pending providers can be approved');
    }
    provider.status = ProviderStatus.ACTIVE;
    await this.providerRepo.save(provider);
  }

  /**
   * Admin: Reject provider.
   */
  async rejectProvider(providerId: string, reason: string): Promise<void> {
    const provider = await this.providerRepo.findOne({ where: { id: providerId } });
    if (!provider) throw ApiError.notFound('Provider');
    provider.status = ProviderStatus.DEACTIVATED;
    await this.providerRepo.save(provider);
    console.log(`Provider ${provider.email} rejected. Reason: ${reason}`);
  }

  /**
   * Get pending providers.
   */
  async getPendingProviders(): Promise<ServiceProvider[]> {
    return this.providerRepo.find({
      where: { status: ProviderStatus.PENDING },
      order: { created_at: 'ASC' },
    });
  }
}

export const providerService = new ProviderService();
