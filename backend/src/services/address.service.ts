import { AppDataSource } from '../config/data-source';
import { Address, AddressLabel } from '../entities/Address';
import { ApiError } from '../errors/api-error';

const MAX_ADDRESSES = 5;

export interface CreateAddressDto {
  full_address: string;
  label: AddressLabel;
  latitude?: number;
  longitude?: number;
  is_default?: boolean;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
}

export interface AddressSuggestion {
  place_id: string;
  description: string;
}

export class AddressService {
  private addressRepo = AppDataSource.getRepository(Address);

  /**
   * Get all saved addresses for a user.
   */
  async getUserAddresses(userId: string): Promise<Address[]> {
    return this.addressRepo.find({
      where: { user_id: userId },
      order: { is_default: 'DESC', created_at: 'DESC' },
    });
  }

  /**
   * Create a new saved address (max 5 per user).
   */
  async createAddress(userId: string, dto: CreateAddressDto): Promise<Address> {
    const count = await this.addressRepo.count({ where: { user_id: userId } });
    if (count >= MAX_ADDRESSES) {
      throw ApiError.badRequest(`Maximum of ${MAX_ADDRESSES} addresses allowed. Please delete one before adding a new one.`);
    }

    // If setting as default, unset other defaults
    if (dto.is_default) {
      await this.addressRepo.update({ user_id: userId }, { is_default: false });
    }

    const address = this.addressRepo.create({
      user_id: userId,
      full_address: dto.full_address,
      label: dto.label,
      is_default: dto.is_default || false,
      location: dto.latitude && dto.longitude
        ? () => `ST_SetSRID(ST_MakePoint(${dto.longitude}, ${dto.latitude}), 4326)`
        : undefined,
    });

    return this.addressRepo.save(address);
  }

  /**
   * Update an existing address.
   */
  async updateAddress(userId: string, addressId: string, dto: Partial<CreateAddressDto>): Promise<Address> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, user_id: userId },
    });
    if (!address) {
      throw ApiError.notFound('Address');
    }

    if (dto.is_default) {
      await this.addressRepo.update({ user_id: userId }, { is_default: false });
    }

    if (dto.full_address !== undefined) address.full_address = dto.full_address;
    if (dto.label !== undefined) address.label = dto.label;
    if (dto.is_default !== undefined) address.is_default = dto.is_default;

    return this.addressRepo.save(address);
  }

  /**
   * Delete an address.
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.addressRepo.findOne({
      where: { id: addressId, user_id: userId },
    });
    if (!address) {
      throw ApiError.notFound('Address');
    }
    await this.addressRepo.remove(address);
  }

  /**
   * Geocode an address string to coordinates.
   * In production, calls Google Maps Geocoding API.
   * In dev, returns mock data.
   */
  async geocode(address: string): Promise<GeocodingResult> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json() as any;

        if (data.status === 'OK' && data.results.length > 0) {
          const result = data.results[0];
          return {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            formatted_address: result.formatted_address,
          };
        }
      } catch (err) {
        console.error('Geocoding API error:', err);
      }
    }

    // Dev fallback: return mock coordinates (Johannesburg area)
    console.log(`[DEV] Geocoding mock for: ${address}`);
    return {
      latitude: -26.2041 + (Math.random() * 0.1 - 0.05),
      longitude: 28.0473 + (Math.random() * 0.1 - 0.05),
      formatted_address: address,
    };
  }

  /**
   * Reverse geocode coordinates to an address.
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json() as any;

        if (data.status === 'OK' && data.results.length > 0) {
          return {
            latitude,
            longitude,
            formatted_address: data.results[0].formatted_address,
          };
        }
      } catch (err) {
        console.error('Reverse geocoding API error:', err);
      }
    }

    // Dev fallback
    return {
      latitude,
      longitude,
      formatted_address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (mock address)`,
    };
  }

  /**
   * Address autocomplete. Returns suggestions for 3+ characters, empty for fewer.
   */
  async autocomplete(input: string): Promise<AddressSuggestion[]> {
    // Return empty for fewer than 3 characters
    if (!input || input.trim().length < 3) {
      return [];
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json() as any;

        if (data.status === 'OK') {
          return data.predictions.map((p: any) => ({
            place_id: p.place_id,
            description: p.description,
          }));
        }
      } catch (err) {
        console.error('Autocomplete API error:', err);
      }
    }

    // Dev fallback: return mock suggestions
    return [
      { place_id: 'mock_1', description: `${input} Street, Johannesburg` },
      { place_id: 'mock_2', description: `${input} Avenue, Sandton` },
      { place_id: 'mock_3', description: `${input} Road, Pretoria` },
    ];
  }
}

export const addressService = new AddressService();
