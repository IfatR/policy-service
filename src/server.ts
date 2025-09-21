import { PolicyService } from './services/policy-service';
import { DatabaseService } from './services/database-service';
import { PolicyController } from './controllers/policy-controller';
import { PolicyRoutes } from './routes/policy-routes';
import { App } from './app';
import * as dotenv from 'dotenv';
import { Server } from 'http';

// Load environment variables
dotenv.config();

/**
 * Server startup and lifecycle management
 */
class PolicyServer {
  private server?: Server;
  private policyService: PolicyService;
  private app: App;
  private port: number;
  private databaseService: DatabaseService;

  constructor(port: number) {
    this.port = port;
    this.policyService = new PolicyService();
    this.databaseService = new DatabaseService();

    // Create the dependency chain: Service -> Controller -> Routes -> App
    const policyController = new PolicyController(this.policyService);
    const policyRoutes = new PolicyRoutes(policyController);
    this.app = new App(policyRoutes);
  }

  /**
   * Start the server
   */
  async start(mongoConnectionString: string): Promise<void> {
    try {
      // Connect to MongoDB
      await this.policyService.connect(mongoConnectionString);
      console.log('✅ Connected to MongoDB');
      
      // Start the HTTP server
      this.server = this.app.getApp().listen(this.port, () => {
        console.log(`🚀 Policy API Server running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`📚 API Base URL: http://localhost:${this.port}/api`);
        console.log('\n📋 Available Endpoints:');
        console.log(`   POST   /api/policies`);
        console.log(`   GET    /api/policies/:id`);
        console.log(`   GET    /api/policies/tenant/:tenantId`);
        console.log(`   GET    /api/policies`);
        console.log(`   PUT    /api/policies/:id`);
        console.log(`   DELETE /api/policies/:id`);
        console.log(`   GET    /api/policies/:id/rules-mapping`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      if (this.server) {
        this.server.close();
      }
      await this.databaseService.disconnect();
      console.log('🛑 Server shutdown completed');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

async function startServer() {
  const port = parseInt(process.env.PORT || '3000');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/policy-management';
  
  const server = new PolicyServer(port);
  
  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    await server.shutdown();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    await server.shutdown();
    process.exit(0);
  });
  
  // Start the server
  await server.start(mongoUri);
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});