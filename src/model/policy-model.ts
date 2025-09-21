import { Schema, model, Document } from 'mongoose';
import { PolicyDocument } from './policy-types';

// Mongoose schema for Rule
const RuleSchema = new Schema({
  id: { type: String, required: true },
  action: { type: String, enum: ['ALLOW', 'DENY'], required: true },
  resource: { type: String, required: true },
  conditions: { type: String, default: '' }
}, { _id: false });

// Mongoose schema for Assignments
const AssignmentsSchema = new Schema({
  groups: {
    type: Map,
    of: [String],
    default: {}
  },
  users: {
    type: Map,
    of: [String],
    default: {}
  }
}, { _id: false });

// Mongoose schema for Policy
const PolicySchema = new Schema({
  PolicyId: { type: String, required: true, unique: true },
  version: { type: String, required: true },
  tenantId: { type: String, required: true },
  location: { type: String, required: true },
  rules: {
    type: Map,
    of: RuleSchema,
    required: true
  },
  assignments: { type: AssignmentsSchema, required: true },
  status: { type: String, default: 'AC' } // AC = Active, DL = Deleted, etc.
}, { _id: false });

// Main PolicyDocument schema
const PolicyDocumentSchema = new Schema({
  policy: { type: PolicySchema, required: true }
}, {
  timestamps: true,
  versionKey: false
});

// Index for better query performance
PolicyDocumentSchema.index({ 'policy.tenantId': 1 });

// Interface that extends Document for Mongoose
export interface IPolicyDocument extends Document {
  policy: PolicyDocument['policy'];
}

// Export the model
export const PolicyModel = model<IPolicyDocument>('Policy', PolicyDocumentSchema);