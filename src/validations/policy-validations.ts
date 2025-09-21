// Policy validation schemas and functions using Zod
import { z } from 'zod';
import { PolicyDocument } from '../model/policy-types';

// Zod schemas for validation
export const RuleSchema = z.object({
  id: z.string().min(1, 'Rule ID is required'),
  action: z.enum(['ALLOW', 'DENY'], {
    message: 'Action must be either ALLOW or DENY'
  }),
  resource: z.string().min(1, 'Resource is required'),
  conditions: z.string().min(1, 'Conditions are required')
});

export const RulesSchema = z.record(z.string(), RuleSchema);

export const GroupAssignmentsSchema = z.record(z.string(), z.array(z.string()));

export const UserAssignmentsSchema = z.record(z.string(), z.array(z.string()));

export const AssignmentsSchema = z.object({
  groups: GroupAssignmentsSchema,
  users: UserAssignmentsSchema
});

export const PolicySchema = z.object({
  PolicyId: z.string().min(1, 'PolicyId is required'),
  version: z.string().min(1, 'Version is required'),
  tenantId: z.string().min(1, 'TenantId is required'),
  location: z.string().min(1, 'Location is required'),
  rules: RulesSchema,
  assignments: AssignmentsSchema,
  status: z.string().optional() // Optional status field for soft delete
});

export const PolicyDocumentSchema = z.object({
  policy: PolicySchema
});
;
// DTOs with Zod validation
export const CreatePolicyDTOSchema = PolicyDocumentSchema;

export const UpdatePolicyDTOSchema = z.object({
  policy: PolicySchema.partial().optional()
});

// Type inference from Zod schemas
export type CreatePolicyDTO = z.infer<typeof CreatePolicyDTOSchema>;
export type UpdatePolicyDTO = z.infer<typeof UpdatePolicyDTOSchema>;

// Validation result types
export interface ValidationSuccess<T> {
  success: true;
  data: T;
}

export interface ValidationFailure {
  success: false;
  errors: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// Validation helper functions
export const validateCreatePolicy = (data: unknown): ValidationResult<PolicyDocument> => {
  try {
    const result = CreatePolicyDTOSchema.parse(data);
    return { success: true as const, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false as const, 
        errors: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      };
    }
    return { 
      success: false as const, 
      errors: ['Invalid data format'] 
    };
  }
};

export const validateUpdatePolicy = (data: unknown): ValidationResult<UpdatePolicyDTO> => {
  try {
    const result = UpdatePolicyDTOSchema.parse(data);
    return { success: true as const, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false as const, 
        errors: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
      };
    }
    return { 
      success: false as const, 
      errors: ['Invalid data format'] 
    };
  }
};

// Additional validation utilities
export const isValidPolicyId = (id: string): boolean => {
  return typeof id === 'string' && id.trim().length > 0;
};

export const isValidRuleAction = (action: string): action is 'ALLOW' | 'DENY' => {
  return action === 'ALLOW' || action === 'DENY';
};