import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial migration - Creates all base tables for IdeaHub
 * Generated based on existing entity definitions
 *
 * Tables created:
 * - users: User accounts with authentication
 * - ideas: Ideas with rich metadata (priority scoring, checklists, etc.)
 * - documents: Documents/folders with version history
 * - prompts: Prompt templates with usage tracking
 */
export class InitialSchema1733840000000 implements MigrationInterface {
  name = 'InitialSchema1733840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for PostgreSQL
    await queryRunner.query(`
      CREATE TYPE "idea_status_enum" AS ENUM (
        'inbox', 'evaluating', 'approved', 'in_progress', 'completed', 'archived'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "idea_category_enum" AS ENUM (
        'product', 'marketing', 'technology', 'business', 'design', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "document_type_enum" AS ENUM ('file', 'folder')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "password" character varying NOT NULL,
        "avatar" character varying,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Create ideas table
    await queryRunner.query(`
      CREATE TABLE "ideas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "summary" text,
        "description" text,
        "status" "idea_status_enum" NOT NULL DEFAULT 'inbox',
        "category" "idea_category_enum" NOT NULL DEFAULT 'other',
        "tags" text,
        "impact" integer NOT NULL DEFAULT 5,
        "effort" integer NOT NULL DEFAULT 5,
        "priorityScore" double precision,
        "checklist" jsonb,
        "attachments" jsonb,
        "links" jsonb,
        "snapshots" jsonb,
        "lastSavedState" jsonb,
        "timeline" jsonb,
        "linkedDocIds" text,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ideas" PRIMARY KEY ("id")
      )
    `);

    // Create documents table
    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "type" "document_type_enum" NOT NULL DEFAULT 'file',
        "content" text,
        "parentId" character varying,
        "versions" jsonb,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents" PRIMARY KEY ("id")
      )
    `);

    // Create prompts table
    await queryRunner.query(`
      CREATE TABLE "prompts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "content" text NOT NULL,
        "category" character varying,
        "tags" text,
        "isFavorite" boolean NOT NULL DEFAULT false,
        "usageCount" integer NOT NULL DEFAULT 0,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_prompts" PRIMARY KEY ("id")
      )
    `);

    // Create foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "ideas"
      ADD CONSTRAINT "FK_ideas_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD CONSTRAINT "FK_documents_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "prompts"
      ADD CONSTRAINT "FK_prompts_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for better query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_ideas_userId" ON "ideas" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ideas_status" ON "ideas" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_ideas_category" ON "ideas" ("category")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documents_userId" ON "documents" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documents_parentId" ON "documents" ("parentId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_prompts_userId" ON "prompts" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_prompts_isFavorite" ON "prompts" ("isFavorite")
    `);

    // Enable uuid-ossp extension if not already enabled
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_prompts_isFavorite"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_prompts_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_parentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_documents_userId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ideas_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ideas_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ideas_userId"`);

    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "prompts" DROP CONSTRAINT IF EXISTS "FK_prompts_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "FK_documents_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ideas" DROP CONSTRAINT IF EXISTS "FK_ideas_user"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "prompts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ideas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "document_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "idea_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "idea_status_enum"`);
  }
}
