import { z } from 'zod';

/**
 * Zod schemas for Idea entity JSONB fields
 * These schemas ensure data integrity for complex nested structures
 */

// Checklist item schema
export const ChecklistItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(500),
  completed: z.boolean(),
});

export const ChecklistSchema = z.array(ChecklistItemSchema).optional();

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

// Attachment schema
export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  url: z.string().url(),
  type: z.string().min(1).max(100),
  size: z.number().positive().optional(),
});

export const AttachmentsSchema = z.array(AttachmentSchema).optional();

export type Attachment = z.infer<typeof AttachmentSchema>;

// Link schema
export const LinkSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  url: z.string().url(),
});

export const LinksSchema = z.array(LinkSchema).optional();

export type Link = z.infer<typeof LinkSchema>;

// Snapshot schema (for idea snapshots/versions)
export const SnapshotSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  content: z.string(),
  createdAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
});

export const SnapshotsSchema = z.array(SnapshotSchema).optional();

export type Snapshot = z.infer<typeof SnapshotSchema>;

// Last saved state schema (where I stopped working)
export const LastSavedStateSchema = z.object({
  whereIStopped: z.string().max(1000).optional(),
  whatIWasDoing: z.string().max(1000).optional(),
  nextSteps: z.string().max(2000).optional(),
  savedAt: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)).optional(),
}).optional();

export type LastSavedState = z.infer<typeof LastSavedStateSchema>;

// Timeline item schema (activity log)
export const TimelineItemSchema = z.object({
  id: z.string().uuid(),
  action: z.string().min(1).max(100),
  description: z.string().max(500),
  timestamp: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
});

export const TimelineSchema = z.array(TimelineItemSchema).optional();

export type TimelineItem = z.infer<typeof TimelineItemSchema>;
