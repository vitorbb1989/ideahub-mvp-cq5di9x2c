import { z } from 'zod';

/**
 * Zod schemas for Document entity JSONB fields
 * These schemas ensure data integrity for complex nested structures
 */

// Document version schema (for version history)
export const DocumentVersionSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  createdAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
  description: z.string().max(500).optional(),
});

export const DocumentVersionsSchema = z.array(DocumentVersionSchema).optional();

export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;
