import { Request, Response } from 'express';
import { PolicyService } from '../services/policy-service';
import { PolicyDocument, Policy } from '../model/policy-types';
import { 
  CreatePolicyDTO, 
  UpdatePolicyDTO,
  validateCreatePolicy,
  validateUpdatePolicy
} from '../validations/policy-validations';

/**
 * Pure controller class - handles only HTTP request/response logic
 * No route setup, no middleware, no server lifecycle - just business logic coordination
 */
export class PolicyController {
  private policyService: PolicyService;

  constructor(policyService: PolicyService) {
    this.policyService = policyService;
  }

  /**
   * Create a new policy
   */
  async createPolicy(req: Request, res: Response): Promise<void> {
    try {
      // Validate using Zod schema
      const validation = validateCreatePolicy(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
        return;
      }

      // Type-safe data from Zod validation
      const result = await this.policyService.createPolicy(validation.data as PolicyDocument);
      
      if (result.success && result.data) {
        // Extract the policy ID from the created policy
        const createdPolicy = result.data as PolicyDocument;
        const policyId = createdPolicy.policy?.PolicyId || 'Unknown';
        
        // Return full policy data including status field
        const cleanResponse = {
          success: true,
          policyId: policyId,
          data: {
            policy: createdPolicy.policy
          },
          message: `Policy ${policyId} created successfully`
        };
        
        res.status(201).json(cleanResponse);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ 
          success: false, 
          message: 'Internal server error',
          error: message 
        });
    }
  }

  /**
   * Get policy by ID
   */
  async getPolicyById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.policyService.getPolicyById(id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }

  /**
   * Get policies by tenant
   */
  async getPoliciesByTenant(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const result = await this.policyService.getPoliciesByTenant(tenantId);
      
      res.json(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: message });
    }
  }

  /**
   * Get all policies with optional filtering
   */
  async getAllPolicies(req: Request, res: Response): Promise<void> {
    try {
      const filter = req.query.filter ? JSON.parse(req.query.filter as string) : {};
      const result = await this.policyService.getAllPolicies(filter);
      
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }

  /**
   * Update a policy
   */
  async updatePolicy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id || typeof id !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Policy ID is required and must be a string'
        });
        return;
      }
      
      // Validate using Zod schema
      const validation = validateUpdatePolicy(req.body);
      
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors
        });
        return;
      }

      // Convert Zod-validated data to format expected by PolicyService
      const updatePolicyDTO: UpdatePolicyDTO = validation.data;
      const updateData: { policy?: Partial<Policy> } = {};
      
      if (updatePolicyDTO.policy) {
        // Zod ensures updatePolicyDTO.policy is Partial<Policy>
        updateData.policy = updatePolicyDTO.policy;
      }
      
      const result = await this.policyService.updatePolicy(id, updateData as Partial<PolicyDocument>);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: message 
      });
    }
  }

  /**
   * Delete a policy (soft delete - sets status to DL)
   */
  async deletePolicy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.policyService.deletePolicy(id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }

  /**
   * Get rules to users and groups mapping
   */
  async getRulesMapping(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const mapping = await this.policyService.generateRulesToUsersAndGroups(id);
      
      if (mapping) {
        res.json({
          success: true,
          data: {
            policyId: id,
            rulesToUsersAndGroups: mapping
          }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Policy not found or failed to generate mapping'
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ success: false, error: message });
    }
  }
}