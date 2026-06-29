import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "provider_status_enum" AS ENUM ('pending', 'active', 'suspended', 'deactivated')
    `);
    await queryRunner.query(`
      CREATE TYPE "provider_availability_enum" AS ENUM ('online', 'offline')
    `);
    await queryRunner.query(`
      CREATE TYPE "address_label_enum" AS ENUM ('Home', 'Office', 'Other')
    `);
    await queryRunner.query(`
      CREATE TYPE "booking_status_enum" AS ENUM ('requested', 'accepted', 'declined', 'expired', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE "moderation_status_enum" AS ENUM ('pending', 'approved', 'rejected')
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'held', 'completed', 'refunded', 'failed', 'disputed')
    `);
    await queryRunner.query(`
      CREATE TYPE "payment_method_enum" AS ENUM ('credit_card', 'debit_card', 'upi', 'digital_wallet')
    `);
    await queryRunner.query(`
      CREATE TYPE "dispute_status_enum" AS ENUM ('open', 'resolved')
    `);
    await queryRunner.query(`
      CREATE TYPE "dispute_resolution_enum" AS ENUM ('full_refund', 'partial_refund', 'dismissed')
    `);
    await queryRunner.query(`
      CREATE TYPE "recipient_type_enum" AS ENUM ('user', 'provider', 'admin')
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM ('booking_status', 'payment', 'rating', 'system', 'promotion')
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_channel_enum" AS ENUM ('in_app', 'push', 'email')
    `);
    await queryRunner.query(`
      CREATE TYPE "admin_role_enum" AS ENUM ('super_admin', 'admin', 'moderator')
    `);
    await queryRunner.query(`
      CREATE TYPE "admin_action_type_enum" AS ENUM ('approve_provider', 'suspend_provider', 'deactivate_provider', 'resolve_dispute', 'moderate_review', 'manage_category', 'system_config')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(100) NOT NULL,
        "phone" varchar(20),
        "avatar_url" varchar(500),
        "role" varchar(10) NOT NULL DEFAULT 'user',
        "email_verified" boolean NOT NULL DEFAULT false,
        "oauth_provider" varchar(20),
        "oauth_id" varchar(255),
        "notification_preferences" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Create service_providers table
    await queryRunner.query(`
      CREATE TABLE "service_providers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(100) NOT NULL,
        "phone" varchar(20),
        "address" text,
        "experience_years" int NOT NULL DEFAULT 0,
        "hourly_rate" decimal(10,2),
        "service_radius_km" int NOT NULL DEFAULT 10,
        "status" "provider_status_enum" NOT NULL DEFAULT 'pending',
        "availability" "provider_availability_enum" NOT NULL DEFAULT 'offline',
        "location" geography(Point,4326),
        "id_document_url" varchar(500),
        "average_rating" decimal(3,2) NOT NULL DEFAULT 0,
        "total_bookings" int NOT NULL DEFAULT 0,
        "total_ratings" int NOT NULL DEFAULT 0,
        "notification_preferences" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_providers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_service_providers_email" UNIQUE ("email")
      )
    `);

    // Create service_categories table
    await queryRunner.query(`
      CREATE TABLE "service_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(100) NOT NULL,
        "description" text,
        "icon_url" varchar(500),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_service_categories_name" UNIQUE ("name")
      )
    `);

    // Create addresses table
    await queryRunner.query(`
      CREATE TABLE "addresses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "label" "address_label_enum" NOT NULL DEFAULT 'Home',
        "full_address" text NOT NULL,
        "location" geography(Point,4326),
        "is_default" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_addresses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_addresses_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create provider_categories table
    await queryRunner.query(`
      CREATE TABLE "provider_categories" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        CONSTRAINT "PK_provider_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_provider_categories" UNIQUE ("provider_id", "category_id"),
        CONSTRAINT "FK_provider_categories_provider" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_provider_categories_category" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE CASCADE
      )
    `);

    // Create bookings table
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reference_code" varchar(20) NOT NULL,
        "user_id" uuid NOT NULL,
        "provider_id" uuid NOT NULL,
        "category_id" uuid NOT NULL,
        "location" geography(Point,4326),
        "address" text,
        "description" varchar(500),
        "status" "booking_status_enum" NOT NULL DEFAULT 'requested',
        "scheduled_at" TIMESTAMP WITH TIME ZONE,
        "accepted_at" TIMESTAMP WITH TIME ZONE,
        "started_at" TIMESTAMP WITH TIME ZONE,
        "completed_at" TIMESTAMP WITH TIME ZONE,
        "cancelled_at" TIMESTAMP WITH TIME ZONE,
        "estimated_duration_minutes" int,
        "estimated_cost" decimal(10,2),
        "final_cost" decimal(10,2),
        "cancellation_reason" text,
        "cancellation_fee" decimal(10,2),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bookings" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_bookings_reference_code" UNIQUE ("reference_code"),
        CONSTRAINT "FK_bookings_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookings_provider" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bookings_category" FOREIGN KEY ("category_id") REFERENCES "service_categories"("id") ON DELETE CASCADE
      )
    `);

    // Create tracking_sessions table
    await queryRunner.query(`
      CREATE TABLE "tracking_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "current_location" geography(Point,4326),
        "eta_minutes" decimal(10,2),
        "distance_km" decimal(10,2),
        "is_active" boolean NOT NULL DEFAULT true,
        "last_updated" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tracking_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tracking_sessions_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE
      )
    `);

    // Create ratings table
    await queryRunner.query(`
      CREATE TABLE "ratings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "provider_id" uuid NOT NULL,
        "stars" int NOT NULL,
        "review_text" varchar(1000),
        "moderation_status" "moderation_status_enum" NOT NULL DEFAULT 'pending',
        "provider_response" varchar(500),
        "provider_response_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ratings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ratings_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ratings_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ratings_provider" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE
      )
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "booking_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "provider_id" uuid NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "platform_commission" decimal(10,2),
        "provider_payout" decimal(10,2),
        "status" "payment_status_enum" NOT NULL DEFAULT 'pending',
        "method" "payment_method_enum" NOT NULL,
        "stripe_payment_intent_id" varchar(255),
        "receipt_url" varchar(500),
        "paid_at" TIMESTAMP WITH TIME ZONE,
        "released_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payments_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_payments_provider" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE
      )
    `);

    // Create admins table
    await queryRunner.query(`
      CREATE TABLE "admins" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(100) NOT NULL,
        "role" "admin_role_enum" NOT NULL DEFAULT 'admin',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admins" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admins_email" UNIQUE ("email")
      )
    `);

    // Create disputes table
    await queryRunner.query(`
      CREATE TABLE "disputes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "payment_id" uuid NOT NULL,
        "raised_by" uuid NOT NULL,
        "reason" text NOT NULL,
        "status" "dispute_status_enum" NOT NULL DEFAULT 'open',
        "resolution" "dispute_resolution_enum",
        "refund_amount" decimal(10,2),
        "resolved_by" uuid,
        "resolved_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_disputes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_disputes_payment" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_disputes_raised_by" FOREIGN KEY ("raised_by") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_disputes_resolved_by" FOREIGN KEY ("resolved_by") REFERENCES "admins"("id") ON DELETE SET NULL
      )
    `);

    // Create earnings table
    await queryRunner.query(`
      CREATE TABLE "earnings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "provider_id" uuid NOT NULL,
        "booking_id" uuid NOT NULL,
        "payment_id" uuid NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "commission_deducted" decimal(10,2) NOT NULL,
        "earning_date" date NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_earnings" PRIMARY KEY ("id"),
        CONSTRAINT "FK_earnings_provider" FOREIGN KEY ("provider_id") REFERENCES "service_providers"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_earnings_booking" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_earnings_payment" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE
      )
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "recipient_id" uuid NOT NULL,
        "recipient_type" "recipient_type_enum" NOT NULL,
        "type" "notification_type_enum" NOT NULL,
        "booking_ref" varchar(20),
        "title" varchar(255) NOT NULL,
        "body" text NOT NULL,
        "channel" "notification_channel_enum" NOT NULL DEFAULT 'in_app',
        "is_read" boolean NOT NULL DEFAULT false,
        "delivered_at" TIMESTAMP WITH TIME ZONE,
        "read_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    // Create admin_actions table
    await queryRunner.query(`
      CREATE TABLE "admin_actions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "admin_id" uuid NOT NULL,
        "action_type" "admin_action_type_enum" NOT NULL,
        "target_id" uuid,
        "target_type" varchar(50),
        "reason" text,
        "metadata" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_actions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_admin_actions_admin" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE
      )
    `);

    // Create spatial indexes (GiST)
    await queryRunner.query(`
      CREATE INDEX "IDX_service_providers_location" ON "service_providers" USING GiST ("location")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_addresses_location" ON "addresses" USING GiST ("location")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_location" ON "bookings" USING GiST ("location")
    `);

    // Create additional indexes for common queries
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_user_id" ON "bookings" ("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_provider_id" ON "bookings" ("provider_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_bookings_status" ON "bookings" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_recipient" ON "notifications" ("recipient_id", "recipient_type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order (respecting foreign key dependencies)
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_actions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "earnings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "disputes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "payments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ratings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tracking_sessions" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "provider_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "addresses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_providers" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admins" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "admin_action_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admin_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_channel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "recipient_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dispute_resolution_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dispute_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_method_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "payment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "moderation_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "booking_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "address_label_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "provider_availability_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "provider_status_enum"`);
  }
}
