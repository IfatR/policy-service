# Policy Management System

A TypeScript-based CRUD controller for managing policy objects with MongoDB storage.

## Features

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ MongoDB integration with Mongoose
- ✅ Type-safe TypeScript interfaces
- ✅ Rule-to-users-groups mapping generation
- ✅ Tenant-based policy filtering
- ✅ Comprehensive error handling

## Policy Structure

The system manages policies with the following structure:

```json
{
  "policy": {
    "PolicyId": "2324234",
    "version": "1.0",
    "tenantId": "xxx",
    "location": "US",
    "rules": {
      "rule1": {
        "id": "1",
        "action": "ALLOW",
        "resource": "webmail",
        "conditions": ""
      },
      "rule2": {
        "id": "2",
        "action": "DENY",
        "resource": "gmail",
        "conditions": ""
      }
    },
    "assignments": {
      "groups": {
        "group1": ["1", "2"],
        "group2": ["1", "4"]
      },
      "users": {
        "user1": ["3", "4"],
        "user2": ["1"]
      }
    }
  }
}
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the TypeScript project:
```bash
npm run build
```

## Usage

### Basic Setup

```typescript
import { PolicyController } from './src/policy-controller';

const controller = new PolicyController();

// Connect to MongoDB
await controller.connect('mongodb://localhost:27017/policy-management');
```

### CRUD Operations

#### Create Policy
```typescript
const policyDocument = {
  policy: {
    PolicyId: "unique-id",
    version: "1.0",
    tenantId: "tenant-123",
    location: "US",
    rules: { /* rules object */ },
    assignments: { /* assignments object */ }
  }
};

const result = await controller.createPolicy(policyDocument);
```

#### Read Policy
```typescript
// Get by policy ID
const policy = await controller.getPolicyById("unique-id");

// Get by tenant
const tenantPolicies = await controller.getPoliciesByTenant("tenant-123");

// Get all policies
const allPolicies = await controller.getAllPolicies();
```

#### Update Policy
```typescript
const updateResult = await controller.updatePolicy("unique-id", {
  policy: {
    ...existingPolicy,
    version: "1.1"
  }
});
```

#### Delete Policy
```typescript
const deleteResult = await controller.deletePolicy("unique-id");
```

### Rules to Users and Groups Mapping

Generate the mapping as specified in requirements:

```typescript
const mapping = await controller.generateRulesToUsersAndGroups("policy-id");
// Returns:
// {
//   "rule1": { "groups": ["group1", "group2"], "users": [] },
//   "rule2": { "groups": [], "users": ["user1", "user2"] }
// }
```

## API Response Format

All methods return a `PolicyResponse` object:

```typescript
interface PolicyResponse {
  success: boolean;
  data?: PolicyDocument | PolicyDocument[];
  message?: string;
  error?: string;
}
```

## File Structure

- `src/policy-types.ts` - TypeScript interfaces and types
- `src/policy-model.ts` - Mongoose schema and model definitions
- `src/policy-controller.ts` - Main CRUD controller class
- `src/policy-example.ts` - Usage examples and demonstrations

## Running the Example

To see the PolicyController in action:

```bash
npm run build
node dist/policy-example.js
```

Note: Make sure MongoDB is running locally or update the connection string in the example.

## MongoDB Requirements

- MongoDB 4.0 or higher
- Connection string format: `mongodb://localhost:27017/database-name`

## Type Safety

The system uses comprehensive TypeScript interfaces:

- `Rule` - Individual rule definition
- `Policy` - Complete policy structure
- `PolicyDocument` - Top-level document structure
- `RuleToUsersAndGroups` - Mapping structure
- `PolicyResponse` - API response format

## Error Handling

All operations include comprehensive error handling and return structured responses indicating success or failure with appropriate error messages.