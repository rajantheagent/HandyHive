import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { config } from './index';
import { authService } from '../services/auth.service';

/**
 * Configure Passport.js strategies for OAuth authentication.
 */
export function configurePassport(): void {
  // Google OAuth Strategy
  if (config.oauth.googleClientId && config.oauth.googleClientSecret) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: config.oauth.googleClientId,
          clientSecret: config.oauth.googleClientSecret,
          callbackURL: `${config.appUrl}/api/auth/google/callback`,
          scope: ['profile', 'email'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('No email found in Google profile'));
            }

            const tokens = await authService.loginOAuth('google', {
              id: profile.id,
              email,
              displayName: profile.displayName || email.split('@')[0],
            });

            return done(null, tokens);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }

  // Facebook OAuth Strategy
  if (config.oauth.facebookClientId && config.oauth.facebookClientSecret) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: config.oauth.facebookClientId,
          clientSecret: config.oauth.facebookClientSecret,
          callbackURL: `${config.appUrl}/api/auth/facebook/callback`,
          profileFields: ['id', 'emails', 'name', 'displayName'],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('No email found in Facebook profile'));
            }

            const tokens = await authService.loginOAuth('facebook', {
              id: profile.id,
              email,
              displayName: profile.displayName || email.split('@')[0],
            });

            return done(null, tokens);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }
}
