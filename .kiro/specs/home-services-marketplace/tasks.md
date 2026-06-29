# Implementation Plan: Home Services Marketplace

## Overview

This plan implements a full-stack Home Services Marketplace using Angular 17+ (frontend) and Node.js/Express (backend) with PostgreSQL/PostGIS, Redis, Socket.IO, and Stripe. Tasks are ordered to build foundational infrastructure first, then layer on domain features, real-time capabilities, and finally admin tools.

## Tasks

- [x] 1. Set up project structure and core infrastructure
  - [x] 1.1 Initialize backend project with Express, TypeScript, TypeORM, and PostgreSQL/PostGIS
    - Create Node.js project with TypeScript configuration
    - Install Express, TypeORM, PostgreSQL driver, PostGIS types, dotenv, cors
    - Configure TypeORM data source with PostGIS extension enabled
    - Set up folder structure: `src/controllers`, `src/services`, `src/entities`, `src/middleware`, `src/routes`, `src/config`, `src/jobs`
    - Create base Express app with health check endpoint
    - _Requirements: 13.1_

  - [x] 1.2 Initialize Angular frontend project with Angular Material and NgRx
    - Create Angular 17+ project with strict TypeScript
    - Install Angular Material, NgRx Store, Socket.IO client, Google Maps Angular wrapper
    - Set up module structure: AuthModule, MapModule, BookingModule, ProviderModule, AdminModule, SharedModule
    - Configure Angular Material theme with Uber-like styling
    - Set up environment configuration files for API URLs and map keys
    - _Requirements: 12.1, 12.2_

  - [x] 1.3 Set up Redis connection and configuration
    - Install ioredis and configure Redis client
    - Create Redis service wrapper for sessions, caching, and rate limiting
    - Define key patterns and TTL constants as per design (session:24h, location:60s, rate_limit:15min, booking timeout:120s, search cache:30s)
    - _Requirements: 13.6_

  - [x] 1.4 Create database entities and initial migration
    - Define TypeORM entities: User, ServiceProvider, Address, ServiceCategory, ProviderCategory, Booking, TrackingSession, Rating, Payment, Dispute, Earning, Notification, Admin, AdminAction
    - Add PostGIS geography columns for location fields (provider location, address location, booking location)
    - Create spatial indexes (GiST) on provider and address location columns
    - Generate and run initial TypeORM migration
    - _Requirements: 4.1, 3.1_

  - [x] 1.5 Set up error handling middleware and API error response format
    - Create `ApiError` class matching design interface (status, code, message, details, retryable, retryAfter)
    - Implement global Express error handler middleware
    - Create validation error formatter for field-specific error messages
    - Set up HTTP status code mapping for error categories (400, 401, 403, 404, 409, 429, 500, 503)
    - _Requirements: 1.3, 2.9, 4.9_

- [x] 2. Checkpoint - Ensure project compiles and health check works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement authentication and security
  - [x] 3.1 Implement user registration with email verification
    - Create RegisterUserDto with validation (email, password, full name 2-100 chars, phone E.164)
    - Implement password hashing with bcrypt (unique salt per account)
    - Implement registration endpoint that creates user and sends verification email
    - Implement email verification endpoint with single-use token
    - Reject duplicate email registrations with 409 Conflict
    - _Requirements: 1.1, 1.7, 1.8, 13.3_

  - [ ]* 3.2 Write property tests for authentication
    - **Property 1: Invalid login credentials return generic error**
    - **Property 2: Expired session tokens are universally rejected**
    - **Property 3: Duplicate email registration is rejected**
    - **Validates: Requirements 1.3, 1.5, 1.8**

  - [x] 3.3 Implement login, JWT session management, and OAuth
    - Implement login endpoint returning accessToken and refreshToken (24h expiry)
    - Implement generic error message for invalid credentials (no field disclosure)
    - Implement Passport.js strategies for Google and Facebook OAuth
    - Implement OAuth callback endpoint
    - Create JWT validation middleware for protected routes
    - Handle expired tokens with redirect to login
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 1.9_

  - [x] 3.4 Implement password reset flow
    - Create password reset request endpoint (sends single-use link valid 15 min)
    - Create password reset confirmation endpoint
    - Implement Nodemailer + SendGrid integration for transactional emails
    - _Requirements: 1.4_

  - [x] 3.5 Implement password validation and rate limiting
    - Enforce password rules: 8-128 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char from !@#$%^&*()-_+=
    - Implement Redis-based rate limiting: 5 failed attempts per 15-min window per IP
    - Block IP for 30 minutes when rate limit exceeded
    - Send email notification to account owner on block
    - _Requirements: 13.4, 13.5, 13.6, 13.7_

  - [ ]* 3.6 Write property tests for password and rate limiting
    - **Property 37: Password hashing uniqueness**
    - **Property 38: Password validation rules**
    - **Property 39: Rate limiting enforcement**
    - **Validates: Requirements 13.3, 13.4, 13.6, 13.7**

  - [x] 3.7 Implement frontend authentication module
    - Create LoginComponent, RegisterComponent, OAuthCallbackComponent, ForgotPasswordComponent
    - Implement Angular HTTP interceptor for JWT token attachment and error handling
    - Implement AuthGuard for protected routes
    - Store tokens in secure storage, handle token refresh
    - _Requirements: 1.1, 1.2, 1.6_

- [x] 4. Checkpoint - Verify authentication flows end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement service provider registration and profile management
  - [x] 5.1 Implement provider registration with document upload
    - Create provider registration endpoint accepting name, email, phone, address, categories (1-5), experience (0-50 years), service radius (1-50 km), ID document
    - Integrate AWS S3/MinIO for file storage (JPEG, PNG, PDF, max 5 MB)
    - Create provider profile with status "pending" on valid submission
    - Return field-specific validation errors on invalid data
    - _Requirements: 2.1, 2.5, 2.8, 2.9_

  - [ ]* 5.2 Write property tests for provider registration
    - **Property 4: Valid provider registration creates pending profile**
    - **Property 5: Document upload validation enforces format and size**
    - **Property 7: Provider category count constraint**
    - **Property 8: Provider registration validation rejects invalid data with specific errors**
    - **Validates: Requirements 2.1, 2.5, 2.8, 2.9**

  - [x] 5.3 Implement provider profile management and availability toggle
    - Create provider profile update endpoint (reflect changes within 30 seconds via cache invalidation)
    - Implement availability toggle (online/offline) updating search visibility
    - Store provider location updates in Redis for real-time position tracking
    - _Requirements: 2.4, 2.6, 2.7_

  - [ ]* 5.4 Write property test for provider search visibility
    - **Property 6: Provider search visibility matches availability status**
    - **Validates: Requirements 2.6, 2.7**

  - [x] 5.5 Implement admin provider verification workflow
    - Create admin endpoint to approve/reject provider registrations
    - Send email and in-app notification on approval/rejection (with reason)
    - Update provider status from "pending" to "active" or back to rejected
    - _Requirements: 2.2, 2.3_

  - [x] 5.6 Implement frontend provider registration and dashboard
    - Create ProviderRegistrationComponent with multi-step form and file upload
    - Create ProviderDashboardComponent showing booking requests with accept/decline and countdown timer
    - Create profile edit component for availability toggle and details update
    - _Requirements: 2.1, 2.4, 2.6, 11.4_

- [x] 6. Implement location and address management
  - [x] 6.1 Implement user location detection and address management API
    - Create address CRUD endpoints (save up to 5 addresses with labels)
    - Implement geocoding endpoint using Google Maps Geocoding API
    - Implement reverse geocoding endpoint
    - Implement address autocomplete endpoint (returns suggestions for 3+ characters, empty for fewer)
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

  - [ ]* 6.2 Write property tests for address and location
    - **Property 9: Address save limit enforcement**
    - **Property 10: Autocomplete requires minimum 3 characters**
    - **Validates: Requirements 3.3, 3.6**

  - [x] 6.3 Implement frontend map view and location components
    - Create MapViewComponent with Google Maps/Leaflet integration
    - Implement browser geolocation detection (accuracy within 100 meters)
    - Create UserMarkerComponent (distinct from provider markers)
    - Create AddressPickerComponent with autocomplete and saved address selection
    - Implement fallback prompt when location cannot be determined
    - Ensure map occupies 60% viewport (desktop) / 50% (mobile) as per design
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 12.2_

- [x] 7. Implement map-based service provider search
  - [x] 7.1 Implement geospatial search API with PostGIS
    - Create search endpoint using ST_DWithin for radius queries (default 10 km, max 25 km, increment 5 km)
    - Implement filters: minimum rating, price range, availability (conjunctive AND logic)
    - Sort results by distance ascending by default, support sorting by rating and price
    - Cap results at 50 providers per query
    - Implement 30-second Redis search result caching
    - Return results within 3 seconds SLA
    - _Requirements: 4.1, 4.4, 4.5, 4.7, 4.8_

  - [ ]* 7.2 Write property tests for search engine
    - **Property 11: Geospatial search returns providers within radius, sorted by distance, capped at 50**
    - **Property 12: Search filters are conjunctive**
    - **Property 13: Provider summary card contains all required fields**
    - **Validates: Requirements 4.1, 4.4, 4.5, 4.3**

  - [x] 7.3 Implement frontend search UI with map markers and filters
    - Create ProviderMarkerComponent for map pins
    - Create SearchBarComponent for category selection
    - Create FilterPanelComponent (rating, price, availability filters)
    - Create ProviderCardComponent showing name, rating, distance, ETA, hourly rate
    - Implement real-time marker updates every 15 seconds
    - Implement "no providers found" message with radius expansion option
    - Implement bottom sheet (mobile) / side panel (desktop) layout
    - Handle search errors with retry option preserving filters
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7, 4.9, 12.4_

- [x] 8. Checkpoint - Verify search and map features work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement booking and request management
  - [x] 9.1 Implement booking request creation and lifecycle API
    - Create booking request endpoint (with description max 500 chars, scheduling 2h-7d future)
    - Implement 2-minute request expiry using Redis key with TTL
    - Implement booking state machine: requested → accepted/declined/expired → en_route → arrived → in_progress → completed/cancelled
    - Implement booking acceptance and decline endpoints
    - Generate alternative provider suggestions (up to 3) on decline/expiry
    - Implement time slot conflict detection (prevent overlapping bookings for same provider)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.8, 5.9, 5.10_

  - [ ]* 9.2 Write property tests for booking system
    - **Property 14: Booking request contains required job details**
    - **Property 15: Alternative provider suggestions respect constraints**
    - **Property 16: Booking description length constraint**
    - **Property 18: Scheduling window validation**
    - **Property 19: Booking time slot conflict detection**
    - **Validates: Requirements 5.1, 5.4, 5.5, 5.8, 5.10**

  - [x] 9.3 Implement booking cancellation with fee logic
    - Implement cancellation endpoint with fee calculation based on time threshold
    - No fee if cancelled > 30 minutes before scheduled time
    - Apply cancellation fee if cancelled ≤ 30 minutes before scheduled time
    - Display fee amount for user confirmation before applying
    - _Requirements: 5.6, 5.7_

  - [ ]* 9.4 Write property test for cancellation fee logic
    - **Property 17: Cancellation fee determined by time until scheduled booking**
    - **Validates: Requirements 5.6, 5.7**

  - [x] 9.5 Implement frontend booking flow
    - Create BookingRequestComponent with description field and scheduling picker
    - Create BookingStatusComponent showing real-time status updates
    - Create BookingHistoryComponent with pagination (50 per page)
    - Implement 2-minute countdown timer on provider dashboard
    - Display alternative providers on decline/expiry
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.8, 11.3_

- [x] 10. Implement real-time tracking with Socket.IO
  - [x] 10.1 Set up Socket.IO server and tracking service
    - Configure Socket.IO server with Redis adapter for horizontal scaling
    - Implement room-based architecture (one room per active booking)
    - Implement provider location update handler (store in Redis, broadcast to room)
    - Implement ETA recalculation on each location update
    - Implement arrival detection (100-meter threshold notification)
    - Implement stale data indicator (no update for 60 seconds)
    - End tracking session when booking status changes to "in_progress"
    - Implement heartbeat (30s client, 90s server timeout)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ]* 10.2 Write property tests for tracking system
    - **Property 20: Arrival notification triggers at 100-meter threshold**
    - **Property 21: ETA recalculation on location update**
    - **Validates: Requirements 6.4, 6.3**

  - [x] 10.3 Implement frontend real-time tracking
    - Create TrackingMapComponent showing provider movement in real-time
    - Implement Socket.IO client with automatic reconnection
    - Display ETA and distance to provider
    - Show arrival notification when provider is within 100 meters
    - Display stale data indicator when location is outdated
    - Update provider position at intervals ≤ 10 seconds
    - Remove tracking view when service begins
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ] 11. Implement rating and review system
- [x] 11. Implement rating and review system
  - [x] 11.1 Implement rating submission and moderation API
    - Create rating endpoint (1-5 stars, optional review 0-1000 chars, within 7 days of completion)
    - Implement average rating calculation (arithmetic mean, 1 decimal place)
    - Implement content moderation: flag reviews with profanity, spam, or personal info
    - Implement provider response endpoint (single reply, max 500 chars)
    - Publish approved reviews within 5 seconds
    - Display total completed bookings alongside average rating
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 11.2 Write property tests for rating system
    - **Property 22: Rating validation constraints**
    - **Property 23: Average rating calculation accuracy**
    - **Property 24: Provider review response constraint**
    - **Property 25: Content moderation flags prohibited content**
    - **Validates: Requirements 7.1, 7.2, 7.4, 7.5**

  - [x] 11.3 Implement frontend rating components
    - Create RatingComponent (star input, text review field)
    - Display rating prompt after booking completion
    - Show provider average rating and review count on profiles
    - Display review list with provider responses
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.6_

- [x] 12. Checkpoint - Verify booking, tracking, and rating flows
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement payment processing
  - [x] 13.1 Implement Stripe payment integration with escrow
    - Integrate Stripe API for tokenized payment processing (no raw card storage)
    - Implement payment intent creation with amount calculation
    - Implement escrow: hold payment until user confirms completion OR 48h timeout
    - Implement payment confirmation and receipt generation
    - Support payment methods: credit card, debit card, UPI, digital wallets
    - Implement retry mechanism (up to 3 retries with user confirmation)
    - Use idempotency keys to prevent double-charging
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 13.10_

  - [ ]* 13.2 Write property tests for payment system
    - **Property 26: Commission calculation correctness**
    - **Property 27: Price estimate calculation**
    - **Property 28: Escrow release conditions**
    - **Validates: Requirements 8.6, 8.7, 8.3**

  - [x] 13.3 Implement commission, earnings, and dispute handling
    - Calculate platform commission and provider payout (commission + payout = total)
    - Transfer provider payout within 24 hours of completion confirmation
    - Implement price estimate display (hourly_rate × duration + service_fees)
    - Create dispute endpoint with admin notification and 48h SLA
    - Record earnings per booking for provider dashboard
    - _Requirements: 8.5, 8.6, 8.7_

  - [x] 13.4 Implement frontend payment flow
    - Create PaymentFormComponent with Stripe Elements integration
    - Display price estimate before booking confirmation
    - Show digital receipt after payment
    - Implement payment retry UI (up to 3 attempts)
    - Create EarningsComponent for provider earnings breakdown
    - _Requirements: 8.1, 8.2, 8.4, 8.7, 11.2_

- [x] 14. Implement notification system
  - [x] 14.1 Implement notification service with multi-channel delivery
    - Create notification service supporting in-app, push (FCM), and email (SendGrid) channels
    - Implement notification dispatch on booking status changes (both user and provider)
    - Deliver notifications within 5 seconds of triggering event
    - Implement notification preference management (per-user channel configuration)
    - Default to all channels when no preferences configured
    - Implement retry logic: 3 attempts per channel within 30s, fallback to next channel
    - Maintain 90-day notification history
    - Set up Bull Queue for async notification processing
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 14.2 Write property tests for notification system
    - **Property 29: Notification dispatch on booking status change**
    - **Property 30: Notification channel routing respects preferences**
    - **Validates: Requirements 9.1, 9.4**

  - [x] 14.3 Implement frontend notification components
    - Create NotificationBellComponent with unread count badge
    - Create notification history view (90-day retention)
    - Create notification preferences settings page
    - Integrate Firebase Cloud Messaging for browser push
    - _Requirements: 9.3, 9.4, 9.5_

- [x] 15. Implement admin panel
  - [x] 15.1 Implement admin dashboard and user management API
    - Create admin dashboard endpoint: total users, active providers, daily bookings, revenue, pending verifications
    - Implement user/provider search endpoint (results within 2 seconds)
    - Implement suspend/deactivate endpoints with reason validation (min 10 chars)
    - Cascade provider suspension: cancel pending/future bookings, notify affected users
    - _Requirements: 10.1, 10.2, 10.3, 10.9_

  - [ ]* 15.2 Write property tests for admin operations
    - **Property 31: Admin action reason minimum length**
    - **Property 33: Provider suspension cascades to pending bookings**
    - **Validates: Requirements 10.3, 10.9**

  - [x] 15.3 Implement admin commission, categories, and dispute management
    - Implement commission rate update (applies only to new bookings after change)
    - Implement service category CRUD (create, update, deactivate)
    - Implement dispute resolution: full refund, partial refund, or dismiss
    - Implement review moderation: approve or remove with author notification
    - _Requirements: 10.4, 10.5, 10.6, 10.7_

  - [ ]* 15.4 Write property test for commission rate scoping
    - **Property 32: Commission rate applies only to new bookings**
    - **Validates: Requirements 10.5**

  - [x] 15.5 Implement admin report export
    - Generate exportable reports in CSV and PDF formats
    - Support bookings, revenue, and user activity reports
    - Support daily, weekly, and monthly aggregation periods
    - _Requirements: 10.8_

  - [x] 15.6 Implement frontend admin panel
    - Create AdminDashboardComponent with metrics overview
    - Create UserManagementComponent with search and suspend/deactivate actions
    - Create ProviderVerificationComponent for approve/reject workflow
    - Create DisputeResolutionComponent
    - Create ReportExportComponent
    - _Requirements: 10.1, 10.2, 10.3, 10.6, 10.7, 10.8_

- [x] 16. Implement provider earnings dashboard and history
  - [x] 16.1 Implement provider dashboard API
    - Create earnings endpoint: total lifetime earnings, completed bookings, average rating, acceptance rate
    - Implement earnings breakdown: by day (30 days), week (12 weeks), month (12 months)
    - Implement booking history endpoint with pagination (50 per page)
    - Calculate acceptance rate: accepted / (accepted + declined + expired) over past 30 days
    - Handle data unavailability gracefully with error message and retry option
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [ ]* 16.2 Write property tests for provider metrics
    - **Property 34: Acceptance rate calculation**
    - **Property 35: Earnings aggregation consistency**
    - **Property 36: Pagination correctness**
    - **Validates: Requirements 11.1, 11.2, 11.3**

- [x] 17. Implement responsive design and performance optimization
  - [x] 17.1 Implement responsive layout and Uber-like UI polish
    - Ensure responsive rendering 320px to 2560px without horizontal scrolling
    - Implement bottom sheet (mobile <768px) / side panel (desktop ≥768px) for provider details
    - Ensure all interactive elements visible and operable without zooming
    - Implement smooth transitions/animations (≥30 FPS, ≤300ms duration)
    - Implement map fallback to list view on load failure (10 second timeout)
    - Ensure initial map load within 3 seconds on 5 Mbps / 50ms connection
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [x] 18. Implement data protection features
  - [x] 18.1 Implement GDPR data export and deletion
    - Implement personal data download endpoint (machine-readable format within 72 hours)
    - Implement data deletion endpoint (remove PII within 30 days, confirm via email)
    - Ensure TLS 1.2+ for all data in transit
    - Ensure AES-256 encryption at rest for personal data and payment info
    - _Requirements: 13.1, 13.2, 13.8, 13.9_

- [x] 19. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests use `fast-check` library with minimum 100 iterations per property
- The frontend uses Angular 17+ with Angular Material; the backend uses Node.js 20+ with Express and TypeORM
- PostGIS spatial queries power the geospatial search (GiST indexed)
- Socket.IO handles real-time tracking with Redis adapter for scaling
- Stripe tokenized processing ensures PCI-DSS compliance without storing raw card numbers
- Bull Queue handles async background jobs (email, push notifications, payment settlement)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["3.1", "3.7"] },
    { "id": 3, "tasks": ["3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["3.5", "3.6"] },
    { "id": 5, "tasks": ["5.1", "6.1"] },
    { "id": 6, "tasks": ["5.2", "5.3", "6.2", "6.3"] },
    { "id": 7, "tasks": ["5.4", "5.5", "5.6"] },
    { "id": 8, "tasks": ["7.1"] },
    { "id": 9, "tasks": ["7.2", "7.3"] },
    { "id": 10, "tasks": ["9.1"] },
    { "id": 11, "tasks": ["9.2", "9.3", "9.5"] },
    { "id": 12, "tasks": ["9.4"] },
    { "id": 13, "tasks": ["10.1"] },
    { "id": 14, "tasks": ["10.2", "10.3"] },
    { "id": 15, "tasks": ["11.1"] },
    { "id": 16, "tasks": ["11.2", "11.3"] },
    { "id": 17, "tasks": ["13.1"] },
    { "id": 18, "tasks": ["13.2", "13.3", "13.4"] },
    { "id": 19, "tasks": ["14.1"] },
    { "id": 20, "tasks": ["14.2", "14.3"] },
    { "id": 21, "tasks": ["15.1", "16.1"] },
    { "id": 22, "tasks": ["15.2", "15.3", "15.4", "16.2"] },
    { "id": 23, "tasks": ["15.5", "15.6"] },
    { "id": 24, "tasks": ["17.1", "18.1"] }
  ]
}
```
