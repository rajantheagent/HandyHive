import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class JwtService {
  /**
   * Generate access and refresh tokens for a user.
   */
  generateTokens(userId: string, email: string, role: string, fullName: string = ''): AuthTokens {
    const accessPayload: object = { userId, email, role, fullName, type: 'access' };
    const refreshPayload: object = { userId, email, role, fullName, type: 'refresh' };

    const accessOptions: SignOptions = { expiresIn: '1h' };
    const refreshOptions: SignOptions = { expiresIn: '24h' };

    const accessToken = jwt.sign(accessPayload, config.jwt.secret, accessOptions);
    const refreshToken = jwt.sign(refreshPayload, config.jwt.secret, refreshOptions);

    // Calculate expiry in seconds (1h = 3600s)
    const decoded = jwt.decode(accessToken) as jwt.JwtPayload;
    const expiresIn = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;

    return { accessToken, refreshToken, expiresIn };
  }

  /**
   * Verify and decode a JWT token.
   * Returns null if token is invalid or expired.
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as unknown as TokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Decode token without verifying (for extracting payload from expired tokens).
   */
  decodeToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.decode(token) as unknown as TokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }
}

export const jwtService = new JwtService();
