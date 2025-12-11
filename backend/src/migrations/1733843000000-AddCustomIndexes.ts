import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

/**
 * Migration: Add Custom Indexes for Query Optimization
 *
 * This migration adds composite indexes to improve query performance for common
 * access patterns. All indexes include userId as the first column since all
 * queries filter by user (ownership validation).
 *
 * Index Strategy:
 * - Composite indexes with userId first (all queries filter by user)
 * - Descending order for timestamp/score columns (most recent first)
 * - Covering indexes for common filter combinations
 *
 * Note: Partial indexes for soft delete were already created in AddSoftDelete migration
 */
export class AddCustomIndexes1733843000000 implements MigrationInterface {
  name = 'AddCustomIndexes1733843000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // IDEAS TABLE INDEXES
    // ============================================

    // Index for filtering ideas by status (most common filter)
    // Used by: Kanban board, status filters, dashboard
    await queryRunner.createIndex(
      'ideas',
      new TableIndex({
        name: 'IDX_ideas_userId_status',
        columnNames: ['userId', 'status'],
      }),
    );

    // Index for filtering ideas by category
    // Used by: Category filters, catalog view
    await queryRunner.createIndex(
      'ideas',
      new TableIndex({
        name: 'IDX_ideas_userId_category',
        columnNames: ['userId', 'category'],
      }),
    );

    // Index for ordering ideas by creation date (newest first)
    // Used by: Default listing, "Recent ideas"
    await queryRunner.query(`
      CREATE INDEX "IDX_ideas_userId_createdAt"
      ON "ideas" ("userId", "createdAt" DESC)
    `);

    // Index for ordering ideas by update date (most recently updated first)
    // Used by: Default listing order
    await queryRunner.query(`
      CREATE INDEX "IDX_ideas_userId_updatedAt"
      ON "ideas" ("userId", "updatedAt" DESC)
    `);

    // Index for ordering ideas by priority score (highest first)
    // Used by: Priority sorting, dashboard "Top priorities"
    await queryRunner.query(`
      CREATE INDEX "IDX_ideas_userId_priorityScore"
      ON "ideas" ("userId", "priorityScore" DESC NULLS LAST)
    `);

    // Composite index for status + category filtering
    // Used by: Advanced filters (e.g., "All IN_PROGRESS ideas in PRODUCT category")
    await queryRunner.createIndex(
      'ideas',
      new TableIndex({
        name: 'IDX_ideas_userId_status_category',
        columnNames: ['userId', 'status', 'category'],
      }),
    );

    // ============================================
    // DOCUMENTS TABLE INDEXES
    // ============================================

    // Index for filtering documents by type (file vs folder)
    // Used by: File browser, folder navigation
    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'IDX_documents_userId_type',
        columnNames: ['userId', 'type'],
      }),
    );

    // Index for finding children of a folder
    // Used by: Folder contents listing, tree navigation
    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'IDX_documents_userId_parentId',
        columnNames: ['userId', 'parentId'],
      }),
    );

    // Index for ordering documents by creation date
    // Used by: "Recent documents"
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_userId_createdAt"
      ON "documents" ("userId", "createdAt" DESC)
    `);

    // Index for ordering documents by update date
    // Used by: Default listing order
    await queryRunner.query(`
      CREATE INDEX "IDX_documents_userId_updatedAt"
      ON "documents" ("userId", "updatedAt" DESC)
    `);

    // ============================================
    // PROMPTS TABLE INDEXES
    // ============================================

    // Index for filtering favorite prompts
    // Used by: "My favorites" filter
    await queryRunner.createIndex(
      'prompts',
      new TableIndex({
        name: 'IDX_prompts_userId_isFavorite',
        columnNames: ['userId', 'isFavorite'],
      }),
    );

    // Index for filtering prompts by category
    // Used by: Category filter in prompt library
    await queryRunner.createIndex(
      'prompts',
      new TableIndex({
        name: 'IDX_prompts_userId_category',
        columnNames: ['userId', 'category'],
      }),
    );

    // Index for ordering prompts by usage count (most used first)
    // Used by: "Most used prompts", analytics
    await queryRunner.query(`
      CREATE INDEX "IDX_prompts_userId_usageCount"
      ON "prompts" ("userId", "usageCount" DESC)
    `);

    // Index for ordering prompts by creation date
    // Used by: "Recent prompts"
    await queryRunner.query(`
      CREATE INDEX "IDX_prompts_userId_createdAt"
      ON "prompts" ("userId", "createdAt" DESC)
    `);

    // Index for ordering prompts by update date
    // Used by: Default listing order
    await queryRunner.query(`
      CREATE INDEX "IDX_prompts_userId_updatedAt"
      ON "prompts" ("userId", "updatedAt" DESC)
    `);

    // ============================================
    // USERS TABLE INDEXES
    // ============================================

    // Index for faster login lookups by email
    // Note: email already has UNIQUE constraint which creates an index,
    // but we add this for explicit documentation
    // Already exists from entity definition, skip this one
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop prompts indexes
    await queryRunner.query(`DROP INDEX "IDX_prompts_userId_updatedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_prompts_userId_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_prompts_userId_usageCount"`);
    await queryRunner.dropIndex('prompts', 'IDX_prompts_userId_category');
    await queryRunner.dropIndex('prompts', 'IDX_prompts_userId_isFavorite');

    // Drop documents indexes
    await queryRunner.query(`DROP INDEX "IDX_documents_userId_updatedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_documents_userId_createdAt"`);
    await queryRunner.dropIndex('documents', 'IDX_documents_userId_parentId');
    await queryRunner.dropIndex('documents', 'IDX_documents_userId_type');

    // Drop ideas indexes
    await queryRunner.dropIndex('ideas', 'IDX_ideas_userId_status_category');
    await queryRunner.query(`DROP INDEX "IDX_ideas_userId_priorityScore"`);
    await queryRunner.query(`DROP INDEX "IDX_ideas_userId_updatedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_ideas_userId_createdAt"`);
    await queryRunner.dropIndex('ideas', 'IDX_ideas_userId_category');
    await queryRunner.dropIndex('ideas', 'IDX_ideas_userId_status');
  }
}
