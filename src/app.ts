import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PolicyRoutes } from './routes/policy-routes';

/**
 * Express application configuration
 * Handles middleware setup and route mounting
 */
export class App {
  private app: Application;
  private policyRoutes: PolicyRoutes;

  constructor(policyRoutes: PolicyRoutes) {
    this.app = express();
    this.policyRoutes = policyRoutes;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Configure middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS middleware
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Logging middleware
    this.app.use(morgan('combined'));
    
    // JSON parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Health check endpoint (not versioned)
    this.app.get('/health', this.policyRoutes.healthCheck.bind(this.policyRoutes));
    
    // Mount API routes
    this.app.use('/api', this.policyRoutes.getRouter());
    
    // 404 handler for all other routes
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        availableEndpoints: this.policyRoutes.getAvailableEndpoints()
      });
    });
  }

  /**
   * Setup error handling middleware
   */
  private setupErrorHandling(): void {
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('API Error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  /**
   * Get the configured Express application
   */
  getApp(): Application {
    return this.app;
  }
}