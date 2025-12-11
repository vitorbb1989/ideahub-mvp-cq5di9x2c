import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration to add refresh token column to users table
 * This enables secure token rotation for JWT authentication
 */
export class AddRefreshToken1733841000000 implements MigrationInterface {
  name = 'AddRefreshToken1733841000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add refreshToken column to users table
    // This stores the hashed refresh token for secure validation
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "refreshToken" character varying
    `);

    // Add index for faster refresh token lookups (optional but recommended)
    await queryRunner.query(`
      CREATE INDEX "IDX_users_refreshToken" ON "users" ("refreshToken")
      WHERE "refreshToken" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_refreshToken"`);

    // Remove refreshToken column
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "refreshToken"
    `);
  }
}
