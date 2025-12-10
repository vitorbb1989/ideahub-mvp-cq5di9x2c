import { z } from 'zod'

// Shared Schemas
export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
})

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable().optional(),
})

// Idea Schemas
export const ideaStatusSchema = z.enum([
  'inbox',
  'nova_ideia',
  'em_analise',
  'mvp',
  'backlog',
  'em_andamento',
  'entregue',
  'arquivada',
])

export const ideaCategorySchema = z.enum([
  'nova_solucao',
  'solucao_em_andamento',
  'melhoria',
  'experimento',
])

export const ideaSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  status: ideaStatusSchema,
  category: ideaCategorySchema,
  impact: z.number().min(1).max(5),
  effort: z.number().min(1).max(5),
  priorityScore: z.number(),
  tags: z.array(tagSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Continuity Schemas
export const ideaLastStateSchema = z.object({
  whereIStopped: z.string(),
  whatIWasDoing: z.string(),
  nextStep: z.string(),
  updatedAt: z.string(),
})

export const ideaChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  done: z.boolean(),
})

export const ideaReferenceLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
})

export const ideaAttachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  url: z.string(),
  createdAt: z.string(),
})

export const ideaSnapshotSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string(),
  data: z.object({
    ideaTitle: z.string(),
    ideaSummary: z.string(),
    lastState: ideaLastStateSchema.nullable(),
    checklist: z.array(ideaChecklistItemSchema),
    references: z.array(ideaReferenceLinkSchema),
    attachments: z.array(ideaAttachmentSchema).optional(),
  }),
})

// Prompt Template Schema
export const promptTemplateSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

// Activity Schema
export const userActivitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum([
    'EMAIL_UPDATE',
    'PASSWORD_CHANGE',
    'AVATAR_UPLOAD',
    'AVATAR_REMOVE',
    'NAME_UPDATE',
  ]),
  details: z.string().optional(),
  date: z.string(),
})

// Collections
export const ideaCollectionSchema = z.array(ideaSchema)
export const tagCollectionSchema = z.array(tagSchema)
export const userCollectionSchema = z.array(
  userSchema.extend({ password: z.string(), createdAt: z.string() }),
)
export const promptTemplateCollectionSchema = z.array(promptTemplateSchema)
export const activityCollectionSchema = z.array(userActivitySchema)
