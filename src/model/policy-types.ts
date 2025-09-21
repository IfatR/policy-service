// TypeScript interfaces for Policy management system

export interface Rule {
  id: string;
  action: 'ALLOW' | 'DENY';
  resource: string;
  conditions: string;
}

export interface Rules {
  [ruleKey: string]: Rule;
}

export interface GroupAssignments {
  [groupName: string]: string[]; // array of rule IDs
}

export interface UserAssignments {
  [userName: string]: string[]; // array of rule IDs
}

export interface Assignments {
  groups: GroupAssignments;
  users: UserAssignments;
}

export interface Policy {
  PolicyId: string;
  version: string;
  tenantId: string;
  location: string;
  rules: Rules;
  assignments: Assignments;
  status?: string; // Status field for soft delete (DL = deleted, AC = active, etc.)
}

export interface PolicyDocument {
  policy: Policy;
}

export interface RuleToUsersAndGroups {
  [ruleId: string]: {
    groups: string[];
    users: string[];
  };
}

export interface PolicyResponse {
  success: boolean;
  data?: PolicyDocument | PolicyDocument[];
  message?: string;
  error?: string;
}