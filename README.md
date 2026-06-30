# Requirements Document

## Introduction

Home Services Marketplace is a web-based platform that connects users with local service providers (electricians, plumbers, carpenters, and other home service professionals). The application follows an Uber-like experience where users can view nearby available service providers on a map, request services, track providers in real-time, and manage bookings. Service providers register on the platform with their skills, availability, and location to receive service requests from users in their vicinity.

## Glossary

- **Platform**: The Home Services Marketplace web application as a whole
- **User**: A customer who searches for and books home services through the Platform
- **Service_Provider**: A registered professional (electrician, plumber, carpenter, etc.) who offers home services through the Platform
- **Admin**: A platform administrator who manages users, service providers, categories, and platform settings
- **Service_Category**: A classification of home services (e.g., Electrical, Plumbing, Carpentry, Painting, Cleaning)
- **Booking**: A confirmed service request from a User to a specific Service_Provider
- **Search_Engine**: The subsystem responsible for finding nearby Service_Providers based on location and category
- **Map_View**: The map-centric UI component that displays Service_Provider locations relative to the User
- **Notification_System**: The subsystem responsible for sending real-time alerts to Users and Service_Providers
- **Payment_System**: The subsystem responsible for processing payments between Users and Service_Providers
- **Rating_System**: The subsystem that manages reviews and ratings for Service_Providers
- **Tracking_System**: The subsystem that provides real-time location tracking of Service_Providers en route to a User
- **Auth_System**: The subsystem responsible for user authentication and authorization
- **Profile_System**: The subsystem managing user and service provider profile data

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a User, I want to register and securely log into the platform, so that I can access home services and manage my bookings.

#### Acceptance Criteria

1. WHEN a User submits a registration form with a valid email address, password, full name (between 2 and 100 characters), and phone number (in E.164 format), THE Auth_System SHALL create a new user account and send an email verification link to the provided email address
2. WHEN a User submits valid login credentials, THE Auth_System SHALL authenticate the User and issue a session token with an expiry of 24 hours
3. IF a User submits invalid login credentials, THEN THE Auth_System SHALL return a generic authentication error message without revealing which field is incorrect
4. WHEN a User requests a password reset, THE Auth_System SHALL send a single-use password reset link valid for 15 minutes to the registered email address
5. WHILE a User session token is expired, THE Auth_System SHALL reject all authenticated requests and redirect the User to the login page
6. THE Auth_System SHALL support OAuth-based login via Google and Facebook providers
7. WHEN a User completes email verification, THE Auth_System SHALL activate the user account and allow full platform access
8. IF a User submits a registration form with an email address already associated with an existing account, THEN THE Auth_System SHALL reject the registration and display an error message indicating the email is already registered
9. IF an OAuth authentication attempt via Google or Facebook fails, THEN THE Auth_System SHALL display an error message indicating the external authentication was unsuccessful and allow the User to retry or use email-based login

### Requirement 2: Service Provider Registration and Profile Management

**User Story:** As a Service_Provider, I want to register on the platform with my professional details, so that I can receive service requests from nearby users.

#### Acceptance Criteria

1. WHEN a Service_Provider submits a registration form with name, email, phone number, address, service categories, experience years (0-50), identity proof, and service area radius (1-50 km), THE Profile_System SHALL create a pending provider profile for admin verification
2. WHEN an Admin approves a Service_Provider registration, THE Profile_System SHALL activate the provider profile and notify the Service_Provider via email and in-app notification
3. IF an Admin rejects a Service_Provider registration, THEN THE Profile_System SHALL notify the Service_Provider with the rejection reason
4. WHEN a Service_Provider updates their profile details, THE Profile_System SHALL save the changes and reflect them in search results within 30 seconds
5. THE Profile_System SHALL require Service_Providers to upload at least one valid government-issued identity document in JPEG, PNG, or PDF format with a maximum file size of 5 MB during registration
6. WHEN a Service_Provider sets their availability status to online, THE Platform SHALL include the Service_Provider in nearby search results
7. WHEN a Service_Provider sets their availability status to offline, THE Platform SHALL exclude the Service_Provider from search results
8. THE Profile_System SHALL allow Service_Providers to specify up to 5 Service_Categories for their skills
9. IF a Service_Provider submits a registration form with invalid or incomplete data, THEN THE Profile_System SHALL reject the submission and display specific validation error messages for each invalid field

### Requirement 3: User Location and Address Management

**User Story:** As a User, I want to set and manage my service location, so that the platform can find nearby service providers accurately.

#### Acceptance Criteria

1. WHEN a User grants browser geolocation permission, THE Platform SHALL detect and display the User current location on the Map_View with accuracy within 100 meters
2. WHEN a User manually enters an address, THE Platform SHALL geocode the address and display the location on the Map_View
3. THE Platform SHALL allow Users to save up to 5 addresses with labels (Home, Office, Other)
4. WHEN a User selects a saved address, THE Platform SHALL set the selected address as the active service location and re-center the Map_View on that location
5. IF the Platform cannot determine User location via geolocation or manual entry, THEN THE Platform SHALL prompt the User to enter their address manually before proceeding
6. WHEN a User enters a partial address in the search field, THE Platform SHALL display autocomplete suggestions after the User has typed at least 3 characters

### Requirement 4: Map-Based Service Provider Search

**User Story:** As a User, I want to search for nearby service providers on a map (similar to how Uber shows nearby drivers), so that I can find and select the most convenient provider.

#### Acceptance Criteria

1. WHEN a User selects a Service_Category, THE Search_Engine SHALL display all available Service_Providers within a 10 km radius on the Map_View as pin markers, showing a maximum of 50 providers at one time
2. THE Map_View SHALL update Service_Provider positions in real-time at intervals of no more than 15 seconds
3. WHEN a User taps on a Service_Provider marker on the Map_View, THE Platform SHALL display a summary card with provider name, rating (1-5 stars), distance in km, estimated arrival time in minutes, and hourly rate in the platform currency
4. THE Search_Engine SHALL sort search results by distance from the User location in ascending order by default
5. WHEN a User applies filters, THE Search_Engine SHALL display only Service_Providers matching all applied filter criteria, where filters include minimum rating (1-5 stars), price range (minimum and maximum hourly rate), and availability (available now or scheduled)
6. THE Map_View SHALL display the User location with a distinct marker differentiating it from Service_Provider markers
7. WHEN no Service_Providers are available within the search radius, THE Platform SHALL display a message suggesting the User expand the search radius or try a different category, and SHALL allow the User to expand the radius in increments of 5 km up to a maximum of 25 km
8. THE Search_Engine SHALL return search results within 3 seconds of a User initiating a search
9. IF the Search_Engine fails to retrieve results due to a location service error or network failure, THEN THE Platform SHALL display an error message indicating the failure reason and provide a retry option while preserving any previously applied filters

### Requirement 5: Service Booking and Request Management

**User Story:** As a User, I want to request and book a service provider, so that I can get my home service needs fulfilled.

#### Acceptance Criteria

1. WHEN a User selects a Service_Provider and confirms a booking request, THE Platform SHALL send the request to the selected Service_Provider with job details including service type, location, and preferred time
2. WHEN a Service_Provider accepts a booking request, THE Platform SHALL confirm the booking to the User and display the Service_Provider estimated arrival time
3. IF a Service_Provider does not respond to a booking request within 2 minutes, THEN THE Platform SHALL mark the request as expired and suggest up to 3 alternative available Service_Providers to the User
4. WHEN a Service_Provider declines a booking request, THE Platform SHALL notify the User and suggest up to 3 alternative available Service_Providers within the same Service_Category and search radius
5. THE Platform SHALL allow Users to add a text description of the service problem up to 500 characters when creating a booking request
6. WHEN a User cancels a confirmed booking more than 30 minutes before the scheduled time, THE Platform SHALL cancel the booking without a cancellation fee
7. IF a User cancels a confirmed booking less than 30 minutes before the scheduled time, THEN THE Platform SHALL display the applicable cancellation fee amount to the User and apply the fee upon User confirmation
8. THE Platform SHALL allow Users to schedule bookings for a future date and time at least 2 hours in advance and up to 7 days in advance
9. WHEN a booking is completed, THE Platform SHALL update the booking status to completed and prompt the User to rate the Service_Provider
10. IF a Service_Provider has already accepted another booking for the same requested time slot, THEN THE Platform SHALL prevent the booking request from being sent to that Service_Provider and exclude them from available results

### Requirement 6: Real-Time Service Provider Tracking

**User Story:** As a User, I want to track the service provider in real-time on the map after booking, so that I know when they will arrive.

#### Acceptance Criteria

1. WHEN a Service_Provider accepts a booking and is en route, THE Tracking_System SHALL display the Service_Provider real-time location on the User Map_View
2. THE Tracking_System SHALL update the Service_Provider location on the Map_View at intervals of no more than 10 seconds
3. THE Tracking_System SHALL display the estimated time of arrival (ETA) based on the Service_Provider current location and route, recalculating the ETA each time the location is updated
4. WHEN a Service_Provider is within 100 meters of the User location, THE Tracking_System SHALL notify the User with an arrival notification
5. IF the Tracking_System loses connection to the Service_Provider location for more than 60 seconds, THEN THE Tracking_System SHALL display the last known location with a stale-data indicator
6. WHEN the Service_Provider arrives and the booking status changes to "in progress," THE Tracking_System SHALL end the real-time tracking session and remove the route view from the Map_View

### Requirement 7: Rating and Review System

**User Story:** As a User, I want to rate and review service providers after a completed service, so that other users can make informed decisions.

#### Acceptance Criteria

1. WHEN a booking is completed, THE Rating_System SHALL prompt the User to submit a rating (1 to 5 stars) and an optional text review of up to 1000 characters within 7 days of service completion
2. THE Rating_System SHALL calculate and display the Service_Provider average rating to one decimal place based on all received ratings
3. WHEN a User submits a review that passes content moderation, THE Rating_System SHALL publish the review on the Service_Provider profile within 5 seconds
4. THE Rating_System SHALL allow Service_Providers to respond to User reviews with a single text reply of up to 500 characters
5. IF a review contains prohibited content (profanity, spam, or personal information), THEN THE Rating_System SHALL flag the review for Admin moderation and withhold publication until approved
6. THE Rating_System SHALL display the total number of completed bookings alongside the average rating on each Service_Provider profile

### Requirement 8: Payment Processing

**User Story:** As a User, I want to pay for services securely through the platform, so that I have a convenient and transparent payment experience.

#### Acceptance Criteria

1. THE Payment_System SHALL support payment via credit card, debit card, UPI, and digital wallets
2. WHEN a booking is completed and the User confirms the final amount, THE Payment_System SHALL process the payment and issue a digital receipt to both the User and the Service_Provider within 60 seconds
3. THE Payment_System SHALL hold the payment in escrow until the User confirms service completion or 48 hours elapse after booking completion, whichever occurs first
4. IF a payment transaction fails, THEN THE Payment_System SHALL notify the User with the failure reason and offer up to 3 retry attempts
5. WHEN a User disputes a payment, THE Payment_System SHALL create a dispute record and notify the Admin for resolution within 48 hours
6. THE Payment_System SHALL deduct the platform commission and transfer the remaining amount to the Service_Provider account within 24 hours of service completion confirmation
7. THE Payment_System SHALL display a price estimate to the User before booking confirmation, calculated from the Service_Provider hourly rate multiplied by the estimated duration plus any applicable service fees

### Requirement 9: Notification System

**User Story:** As a User or Service_Provider, I want to receive real-time notifications about booking updates, so that I stay informed about service status changes.

#### Acceptance Criteria

1. WHEN a booking status changes (requested, accepted, declined, en route, arrived, in progress, completed, cancelled), THE Notification_System SHALL send a notification to both the User and the Service_Provider associated with that booking, indicating the new status and the timestamp of the change
2. THE Notification_System SHALL deliver notifications within 5 seconds of the triggering event
3. THE Notification_System SHALL support in-app notifications, browser push notifications, and email notifications as available delivery channels
4. WHEN a User or Service_Provider configures notification preferences, THE Notification_System SHALL send future notifications only via the channels explicitly enabled by the recipient; WHILE no preferences have been configured, THE Notification_System SHALL deliver notifications via all supported channels by default
5. THE Notification_System SHALL maintain a notification history accessible to the User and Service_Provider for the past 90 days, displaying for each entry the notification type, associated booking reference, message summary, delivery channel, and timestamp
6. IF the Notification_System fails to deliver a notification via a configured channel after 3 retry attempts within 30 seconds, THEN THE Notification_System SHALL log the delivery failure and attempt delivery via the next available configured channel

### Requirement 10: Admin Panel and Platform Management

**User Story:** As an Admin, I want a comprehensive management panel, so that I can oversee platform operations, manage users, and maintain service quality.

#### Acceptance Criteria

1. THE Platform SHALL provide an Admin dashboard displaying key metrics including total users, active service providers, daily bookings, revenue, and pending verifications
2. WHEN an Admin searches for a User or Service_Provider, THE Platform SHALL return matching results within 2 seconds
3. THE Platform SHALL allow Admins to suspend (temporary, reversible block) or deactivate (permanent removal from active use) User and Service_Provider accounts with a recorded reason of at least 10 characters
4. THE Platform SHALL allow Admins to manage Service_Categories (create, update, deactivate)
5. WHEN an Admin updates platform commission rates, THE Platform SHALL apply the new rates to all bookings created after the rate change is saved
6. THE Platform SHALL allow Admins to view and resolve payment disputes by selecting one of: full refund, partial refund, or dismiss
7. THE Platform SHALL allow Admins to review and moderate flagged reviews by selecting approve or remove, and SHALL notify the review author of the moderation decision
8. THE Platform SHALL provide Admins with exportable reports in CSV and PDF formats for bookings, revenue, and user activity (registrations, bookings placed, and cancellations) on a daily, weekly, and monthly basis
9. WHEN an Admin suspends or deactivates a Service_Provider account, THE Platform SHALL cancel all pending and future bookings for that provider and notify affected Users

### Requirement 11: Service Provider Earnings and Dashboard

**User Story:** As a Service_Provider, I want to view my earnings, booking history, and performance metrics, so that I can manage my business effectively.

#### Acceptance Criteria

1. THE Platform SHALL provide Service_Providers with a dashboard displaying total lifetime earnings, count of completed bookings, average rating, and acceptance rate calculated as the number of accepted requests divided by total received requests (accepted plus declined plus expired) over the past 30 days
2. WHEN a Service_Provider views their earnings, THE Platform SHALL display a breakdown by day for the past 30 days, by week for the past 12 weeks, and by month for the past 12 months
3. THE Platform SHALL provide Service_Providers with a booking history showing past and upcoming bookings including booking date, service type, User name, booking status, amount charged, and payment status, displaying up to 50 records per page with pagination controls
4. WHEN a new booking request is received, THE Platform SHALL display it on the Service_Provider dashboard with an accept or decline option and a 2-minute countdown timer
5. IF the Platform cannot retrieve earnings or booking history data, THEN THE Platform SHALL display an error message indicating the data is temporarily unavailable and offer a retry option

### Requirement 12: Responsive Web Design and Uber-Like UI

**User Story:** As a User, I want a responsive, map-centric interface similar to Uber, so that I can use the platform seamlessly on any device.

#### Acceptance Criteria

1. THE Platform SHALL render on screen widths from 320px (mobile) to 2560px (desktop) without horizontal scrolling, with all interactive elements visible and operable without requiring zooming
2. THE Map_View SHALL occupy at least 60% of the viewport height on the main search screen for screen widths 768px and above, and at least 50% of the viewport height for screen widths below 768px
3. THE Platform SHALL load the initial map view within 3 seconds on a connection with at least 5 Mbps download speed and 50ms latency
4. THE Platform SHALL use a bottom sheet on mobile (below 768px width) or a side panel on desktop (768px and above) for service provider details, ensuring the Map_View remains visible while the panel is open
5. THE Platform SHALL render transitions and animations for state changes (booking flow, provider selection, tracking) at a minimum of 30 frames per second with a duration of no more than 300ms
6. IF the Map_View fails to load within 10 seconds, THEN THE Platform SHALL display an error message indicating the map is unavailable and offer a list-based view of nearby Service_Providers as a fallback

### Requirement 13: Security and Data Protection

**User Story:** As a User, I want my personal data and payment information to be secure, so that I can use the platform with confidence.

#### Acceptance Criteria

1. THE Platform SHALL encrypt all data in transit using TLS 1.2 or higher
2. THE Platform SHALL encrypt all stored personal data and payment information at rest using AES-256 or equivalent encryption
3. THE Platform SHALL store passwords using a one-way hash with a unique salt per account
4. THE Auth_System SHALL enforce a password length between 8 and 128 characters including at least one uppercase letter, one lowercase letter, one number, and one special character from the set !@#$%^&*()-_+=
5. IF a User submits a password that does not meet the password requirements, THEN THE Auth_System SHALL reject the submission and display an error message indicating which requirements are not met
6. THE Platform SHALL implement rate limiting on authentication endpoints allowing no more than 5 failed login attempts per 15-minute window per IP address
7. IF the rate limit is exceeded, THEN THE Auth_System SHALL temporarily block the IP address for 30 minutes and send an email notification to the account owner indicating that a login block has been applied
8. WHEN a User requests to download their personal data, THE Platform SHALL provide a downloadable file in machine-readable format within 72 hours of the request
9. WHEN a User requests deletion of their personal data, THE Platform SHALL remove all personally identifiable information from active systems within 30 days and confirm deletion to the User via email
10. THE Payment_System SHALL not store raw credit card numbers and SHALL use tokenized payment processing
