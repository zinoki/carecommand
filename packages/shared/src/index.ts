// Enums and constants
export const ROLES = ['Admin', 'Manager', 'Staff'] as const;
export type Role = (typeof ROLES)[number];

export const PERSON_TYPES = ['Candidate', 'Caregiver', 'Former', 'Blacklisted'] as const;
export type PersonType = (typeof PERSON_TYPES)[number];

export const RECRUITING_STAGES = [
  'Applied',
  'Screening',
  'Interviewing',
  'Offered',
  'Rejected',
  'NoShow',
  'Blacklisted',
] as const;
export type RecruitingStage = (typeof RECRUITING_STAGES)[number];

export const ONBOARDING_STATUSES = [
  'NotStarted',
  'InProgress',
  'ReadyForActivation',
  'Complete',
] as const;
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number];

export const PERSON_STATUSES = [
  'Applied',
  'Screening',
  'Interviewing',
  'Offered',
  'Rejected',
  'NoShow',
  'Blacklisted',
  'NotStarted',
  'InProgress',
  'ReadyForActivation',
  'Complete',
  'Active',
  'Ineligible',
  'Quit',
  'Fired',
  'OnLeave',
  'Other',
] as const;
export type PersonStatus = (typeof PERSON_STATUSES)[number];

export const EVIDENCE_TYPES = ['file', 'link', 'checkbox', 'text'] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const EXPIRATION_RULES = ['none', 'fixed', 'days', 'recurring'] as const;
export type ExpirationRule = (typeof EXPIRATION_RULES)[number];

export const TASK_SOURCES = ['manual', 'onboarding', 'compliance', 'reminder'] as const;
export type TaskSource = (typeof TASK_SOURCES)[number];

export const BILLING_PLANS = ['Free', 'Starter', 'Growth', 'Enterprise'] as const;
export type BillingPlan = (typeof BILLING_PLANS)[number];

// Zod schemas for API validation
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
  agencyName: z.string().min(1).max(255),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(ROLES),
});

export const createPersonSchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  type: z.enum(PERSON_TYPES),
  status: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updatePersonSchema = createPersonSchema.partial();

export const createRequirementTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

export const createRequirementTemplateItemSchema = z.object({
  name: z.string().min(1).max(255),
  required: z.boolean(),
  evidenceType: z.enum(EVIDENCE_TYPES),
  expirationRule: z.enum(EXPIRATION_RULES),
  expirationDays: z.number().int().min(0).optional(),
  ownerRole: z.enum(ROLES).optional(),
  slaDays: z.number().int().min(0).optional(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  personId: z.string().uuid().optional(),
  requirementId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  dueAt: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export const axisCareConnectionSchema = z.object({
  siteNumber: z.string().min(1),
  apiToken: z.string().min(1).optional(), // Required on create, optional on update (keeps existing)
});
