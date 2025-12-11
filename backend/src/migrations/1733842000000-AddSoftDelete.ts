import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add Soft Delete support
 *
 * Adds deletedAt column to ideas, documents, and prompts tables.
 * When this column is set (not null), the record is considered deleted
 * but remains in the database for potential recovery.
 *
 * TypeORM automatically filters out records where deletedAt is not null
 * when using @DeleteDateColumn decorator.
 */
export class AddSoftDelete1733842000000 implements MigrationInterface {
  name = 'AddSoftDelete1733842000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deletedAt column to ideas table
    await queryRunner.query(`
      ALTER TABLE "ideas"
      ADD COLUMN "deletedAt" TIMESTAMP
    `);

    // Add deletedAt column to documents table
    await queryRunner.query(`
      ALTER TABLE "documents"
      ADD COLUMN "deletedAt" TIMESTAMP
    `);

    // Add deletedAt column to prompts table
    await queryRunner.query(`
      ALTER TABLE "prompts"
      ADD COLUMN "deletedAt" TIMESTAMP
    `);

    // Create partial indexes for better query performance on non-deleted records
    // These indexes only include rows where deletedAt IS NULL
    await queryRunner.query(`
      CREATE INDEX "IDX_ideas_userId_not_deleted"
      ON "ideas" ("userId")
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documents_userId_not_deleted"
      ON "documents" ("userId")
      WHERE "deletedAt" IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_prompts_userId_not_deleted"
      ON "prompts" ("userId")
      WHERE "deletedAt" IS NULL
    `);

    // Index for finding deleted records (for admin/restore purposes)
    await queryRunner.query(`
      CREATE INDEX "IDX_ideas_deletedAt"
      ON "ideas" ("deletedAt")
      WHERE "deletedAt" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_documents_deletedAt"
      ON "documents" ("deletedAt")
      WHERE "deletedAt" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_prompts_deletedAt"
      ON "prompts" ("deletedAt")
      WHERE "deletedAt" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX "IDX_prompts_deletedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_deletedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_ideas_deletedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_prompts_userId_not_deleted"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_userId_not_deleted"`);
    await queryRunner.query(`DROP INDEX "IDX_ideas_userId_not_deleted"`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`ALTER TABLE "ideas" DROP COLUMN "deletedAt"`);
  }
}
