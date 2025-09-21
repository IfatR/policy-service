import { Router, Request, Response } from 'express';
import { PolicyController } from '../controllers/policy-controller';
import { DatabaseService } from '../services/database-service';
import { EventBridgeService } from '../services/eventbridge-service';

/**
 * Policy routes configuration
 * Handles route definitions and binds them to controller methods
 */
export class PolicyRoutes {
  private router: Router;
  private policyController: PolicyController;
  private dbService: DatabaseService;
  private eventBridgeService: EventBridgeService;

  constructor(policyController: PolicyController) {
    this.router = Router();
    this.policyController = policyController;
    this.dbService = DatabaseService.getInstance();
    this.eventBridgeService = new EventBridgeService();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Policy CRUD routes
    this.router.post('/policies', this.policyController.createPolicy.bind(this.policyController));
    this.router.get('/policies/:id', this.policyController.getPolicyById.bind(this.policyController));
    this.router.get('/policies/tenant/:tenantId', this.policyController.getPoliciesByTenant.bind(this.policyController));
    this.router.get('/policies', this.policyController.getAllPolicies.bind(this.policyController));
    this.router.put('/policies/:id', this.policyController.updatePolicy.bind(this.policyController));
    this.router.delete('/policies/:id', this.policyController.deletePolicy.bind(this.policyController));
    
    // Special endpoint for rules mapping
    this.router.get('/policies/:id/rules-mapping', this.policyController.getRulesMapping.bind(this.policyController));
  }

  /**
   * Health check endpoint - not part of API routes but commonly used
   */
  healthCheck(req: Request, res: Response): void {
    const dbStatus = this.dbService.getConnectionStatus();
    const eventBridgeConfig = this.eventBridgeService.getConfig();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        connected: dbStatus.isConnected,
        readyState: dbStatus.readyState,
        host: dbStatus.host,
        name: dbStatus.name
      },
      eventBridge: {
        enabled: eventBridgeConfig.enabled,
        eventBusName: eventBridgeConfig.eventBusName,
        source: eventBridgeConfig.source,
        region: eventBridgeConfig.region
      },
      version: '1.0.0'
    });
  }

  /**
   * Get the configured router
   */
  getRouter(): Router {
    return this.router;
  }

  /**
   * Get available endpoints for 404 responses
   */
  getAvailableEndpoints(): string[] {
    return [
      'GET /health',
      'POST /api/policies',
      'GET /api/policies/:id',
      'GET /api/policies/tenant/:tenantId',
      'GET /api/policies',
      'PUT /api/policies/:id',
      'DELETE /api/policies/:id',
      'GET /api/policies/:id/rules-mapping'
    ];
  }
}