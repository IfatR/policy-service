import { PolicyModel, IPolicyDocument } from '../model/policy-model';
import { PolicyDocument, PolicyResponse, RuleToUsersAndGroups, Policy } from '../model/policy-types';
import { DatabaseService } from './database-service';
import { EventBridgeService } from './eventbridge-service';

export class PolicyService {
  private dbService: DatabaseService;
  private eventBridgeService: EventBridgeService;

  constructor() {
    this.dbService = DatabaseService.getInstance();
    this.eventBridgeService = new EventBridgeService();
  }

  /**
   * Connect to MongoDB using the DatabaseService
   * @param connectionString MongoDB connection string
   */
  async connect(connectionString: string): Promise<void> {
    try {
      await this.dbService.connect(connectionString);
    } catch (error) {
      throw new Error(`Failed to connect to MongoDB: ${error}`);
    }
  }
  /**
   * Create a new policy
   * @param policyDocument The policy document to create
   * @returns PolicyResponse with the created policy
   */
  async createPolicy(policyDocument: PolicyDocument): Promise<PolicyResponse> {
    try {
      const newPolicy = new PolicyModel(policyDocument);

      const savedPolicy = await newPolicy.save();
      
      const responseData = savedPolicy.toObject();
      
      // Publish event to EventBridge (async, don't wait for it)
      this.eventBridgeService.publishPolicyCreated(responseData as PolicyDocument)
        .catch(error => console.error('EventBridge publish error:', error));
      
      return {
        success: true,
        data: responseData,
        message: 'Policy created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create policy: ${error}`
      };
    }
  }

  /**
   * Get a policy by PolicyId
   * @param policyId The policy ID to retrieve
   * @returns PolicyResponse with the policy or error
   */
  async getPolicyById(policyId: string): Promise<PolicyResponse> {
    try {
      const policy = await PolicyModel.findOne({ 
        'policy.PolicyId': policyId,
        'policy.status': { $ne: 'DL' } // Exclude deleted policies
      }).lean();
      
      if (!policy) {
        return {
          success: false,
          message: 'Policy not found'
        };
      }

      return {
        success: true,
        data: policy as PolicyDocument
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve policy: ${error}`
      };
    }
  }

  /**
   * Get all policies for a tenant
   * @param tenantId The tenant ID
   * @returns PolicyResponse with array of policies
   */
  async getPoliciesByTenant(tenantId: string): Promise<PolicyResponse> {
    try {
      const policies = await PolicyModel.find({ 
        'policy.tenantId': tenantId,
        'policy.status': { $ne: 'DL' } // Exclude deleted policies
      }).lean();
      
      return {
        success: true,
        data: policies as PolicyDocument[]
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve policies: ${error}`
      };
    }
  }

  /**
   * Update a policy
   * @param policyId The policy ID to update
   * @param updateData The data to update
   * @returns PolicyResponse with the updated policy
   */
  async updatePolicy(policyId: string, updateData: Partial<PolicyDocument>): Promise<PolicyResponse> {
    try {
      const updatedPolicy = await PolicyModel.findOneAndUpdate(
        { 
          'policy.PolicyId': policyId,
          'policy.status': { $ne: 'DL' } // Only update policies that are not deleted
        },
        updateData,
        { new: true, runValidators: true }
      ).lean();

      if (!updatedPolicy) {
        return {
          success: false,
          message: 'Policy not found or has been deleted'
        };
      }

      const responseData = updatedPolicy as PolicyDocument;
      
      // Publish event to EventBridge (async, don't wait for it)
      this.eventBridgeService.publishPolicyUpdated(policyId, responseData, updateData)
        .catch(error => console.error('EventBridge publish error:', error));

      return {
        success: true,
        data: responseData,
        message: 'Policy updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update policy: ${error}`
      };
    }
  }

  /**
   * Delete a policy (soft delete - sets status to DL)
   * @param policyId The policy ID to delete
   * @returns PolicyResponse with success status
   */
  async deletePolicy(policyId: string): Promise<PolicyResponse> {
    try {
      const updatedPolicy = await PolicyModel.findOneAndUpdate(
        { 'policy.PolicyId': policyId, 'policy.status': { $ne: 'DL' } }, // Only update if not already deleted
        { $set: { 'policy.status': 'DL' } },
        { new: true }
      );

      if (!updatedPolicy) {
        return {
          success: false,
          message: 'Policy not found or already deleted'
        };
      }

      // Publish event to EventBridge (async, don't wait for it)
      const tenantId = updatedPolicy.policy?.tenantId || 'unknown';
      this.eventBridgeService.publishPolicyDeleted(policyId, tenantId)
        .catch(error => console.error('EventBridge publish error:', error));

      return {
        success: true,
        message: `Policy ${policyId} marked as deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete policy: ${error}`
      };
    }
  }

  /**
   * Generate rulesToUsersAndGroups mapping from a policy
   * @param policyId The policy ID to generate mapping for
   * @returns RuleToUsersAndGroups mapping
   */
  async generateRulesToUsersAndGroups(policyId: string): Promise<RuleToUsersAndGroups | null> {
    try {
      const policyResponse = await this.getPolicyById(policyId);
      
      if (!policyResponse.success || !policyResponse.data) {
        return null;
      }

      const policy = policyResponse.data as PolicyDocument;
      const rulesToUsersAndGroups: RuleToUsersAndGroups = {};

      // Initialize all rules with empty arrays
      Object.keys(policy.policy.rules).forEach(ruleKey => {
        const rule = policy.policy.rules[ruleKey];
        rulesToUsersAndGroups[rule.id] = {
          groups: [],
          users: []
        };
      });

      // Process group assignments
      Object.entries(policy.policy.assignments.groups).forEach(([groupName, ruleIds]) => {
        ruleIds.forEach(ruleId => {
          if (rulesToUsersAndGroups[ruleId]) {
            rulesToUsersAndGroups[ruleId].groups.push(groupName);
          }
        });
      });

      // Process user assignments
      Object.entries(policy.policy.assignments.users).forEach(([userName, ruleIds]) => {
        ruleIds.forEach(ruleId => {
          if (rulesToUsersAndGroups[ruleId]) {
            rulesToUsersAndGroups[ruleId].users.push(userName);
          }
        });
      });

      return rulesToUsersAndGroups;
    } catch (error) {
      console.error(`Failed to generate rules to users and groups mapping: ${error}`);
      return null;
    }
  }

  /**
   * Get all policies with optional filtering
   * @param filter Optional filter criteria
   * @returns PolicyResponse with array of policies
   */
  async getAllPolicies(filter: Record<string, unknown> = {}): Promise<PolicyResponse> {
    try {
      // Add default filter to exclude deleted policies unless explicitly requested
      const finalFilter = {
        ...filter,
        'policy.status': filter['policy.status'] || { $ne: 'DL' } // Exclude deleted policies by default
      };
      
      const policies = await PolicyModel.find(finalFilter).lean();
      
      return {
        success: true,
        data: policies as PolicyDocument[]
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to retrieve policies: ${error}`
      };
    }
  }
}