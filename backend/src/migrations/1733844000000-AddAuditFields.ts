import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

/**
 * Migration: Add Audit Fields
 *
 * Adds createdBy and updatedBy columns to track who created and last modified records.
 * These fields enable audit trail functionality for compliance and debugging.
 */
export class AddAuditFields1733844000000 implements MigrationInterface {
  name = 'AddAuditFields1733844000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // IDEAS TABLE
    // ============================================
    await queryRunner.addColumns('ideas', [
      new TableColumn({
        name: 'createdBy',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'updatedBy',
        type: 'uuid',
        isNullable: true,
      }),
    ]);

    // Add foreign key for createdBy
    await queryRunner.createForeignKey(
      'ideas',
      new TableForeignKey({
        name: 'FK_ideas_createdBy',
        columnNames: ['createdBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Add foreign key for updatedBy
    await queryRunner.createForeignKey(
      'ideas',
      new TableForeignKey({
        name: 'FK_ideas_updatedBy',
        columnNames: ['updatedBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // ============================================
    // DOCUMENTS TABLE
    // ============================================
    await queryRunner.addColumns('documents', [
      new TableColumn({
        name: 'createdBy',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'updatedBy',
        type: 'uuid',
        isNullable: true,
      }),
    ]);

    await queryRunner.createForeignKey(
      'documents',
      new TableForeignKey({
        name: 'FK_documents_createdBy',
        columnNames: ['createdBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'documents',
      new TableForeignKey({
        name: 'FK_documents_updatedBy',
        columnNames: ['updatedBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // ============================================
    // PROMPTS TABLE
    // ============================================
    await queryRunner.addColumns('prompts', [
      new TableColumn({
        name: 'createdBy',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'updatedBy',
        type: 'uuid',
        isNullable: true,
      }),
    ]);

    await queryRunner.createForeignKey(
      'prompts',
      new TableForeignKey({
        name: 'FK_prompts_createdBy',
        columnNames: ['createdBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'prompts',
      new TableForeignKey({
        name: 'FK_prompts_updatedBy',
        columnNames: ['updatedBy'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // ============================================
    // BACKFILL EXISTING RECORDS
    // Set createdBy and updatedBy to userId for existing records
    // ============================================
    await queryRunner.query(`UPDATE "ideas" SET "createdBy" = "userId", "updatedBy" = "userId" WHERE "createdBy" IS NULL`);
    await queryRunner.query(`UPDATE "documents" SET "createdBy" = "userId", "updatedBy" = "userId" WHERE "createdBy" IS NULL`);
    await queryRunner.query(`UPDATE "prompts" SET "createdBy" = "userId", "updatedBy" = "userId" WHERE "createdBy" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys and columns from prompts
    await queryRunner.dropForeignKey('prompts', 'FK_prompts_updatedBy');
    await queryRunner.dropForeignKey('prompts', 'FK_prompts_createdBy');
    await queryRunner.dropColumns('prompts', ['createdBy', 'updatedBy']);

    // Drop foreign keys and columns from documents
    await queryRunner.dropForeignKey('documents', 'FK_documents_updatedBy');
    await queryRunner.dropForeignKey('documents', 'FK_documents_createdBy');
    await queryRunner.dropColumns('documents', ['createdBy', 'updatedBy']);

    // Drop foreign keys and columns from ideas
    await queryRunner.dropForeignKey('ideas', 'FK_ideas_updatedBy');
    await queryRunner.dropForeignKey('ideas', 'FK_ideas_createdBy');
    await queryRunner.dropColumns('ideas', ['createdBy', 'updatedBy']);
  }
}
