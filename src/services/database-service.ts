import { connect, disconnect, ConnectOptions, Connection, connection } from 'mongoose';

export class DatabaseService {
  private static instance: DatabaseService;
  private isConnected: boolean = false;
  private connectionString: string = '';

  // Singleton pattern to ensure only one database connection
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Connect to MongoDB
   * @param connectionString MongoDB connection string
   * @param options Optional connection options
   */
  async connect(connectionString: string, options?: ConnectOptions): Promise<void> {
    try {
      if (!this.isConnected) {
        this.connectionString = connectionString;
        
        const defaultOptions: ConnectOptions = {
          maxPoolSize: 10, // Maintain up to 10 socket connections
          serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
          socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        };

        const finalOptions = { ...defaultOptions, ...options };
        
        await connect(connectionString, finalOptions);
        this.isConnected = true;
        console.log('✅ Connected to MongoDB');
        
        // Set up connection event listeners
        this.setupEventListeners();
      } else {
        console.log('📝 Already connected to MongoDB');
      }
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to MongoDB: ${error}`);
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await disconnect();
        this.isConnected = false;
        console.log('❌ Disconnected from MongoDB');
      }
    } catch (error) {
      throw new Error(`Failed to disconnect from MongoDB: ${error}`);
    }
  }

  /**
   * Check if connected to MongoDB
   */
  isConnectionActive(): boolean {
    return this.isConnected && connection.readyState === 1;
  }

  /**
   * Get the current connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    readyState: number;
    host?: string;
    port?: number;
    name?: string;
  } {
    return {
      isConnected: this.isConnected,
      readyState: connection.readyState,
      host: connection.host,
      port: connection.port,
      name: connection.name,
    };
  }

  /**
   * Get the MongoDB connection instance
   */
  getConnection(): Connection {
    return connection;
  }

  /**
   * Reconnect to MongoDB using the stored connection string
   */
  async reconnect(): Promise<void> {
    if (this.connectionString) {
      await this.disconnect();
      await this.connect(this.connectionString);
    } else {
      throw new Error('No connection string available for reconnection');
    }
  }

  /**
   * Set up event listeners for the MongoDB connection
   */
  private setupEventListeners(): void {
    connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
    });

    connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    connection.on('disconnected', () => {
      console.log('❌ Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB');
      this.isConnected = true;
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await this.disconnect();
        console.log('🛑 MongoDB connection closed due to app termination');
        process.exit(0);
      } catch (error) {
        console.error('Error closing MongoDB connection:', error);
        process.exit(1);
      }
    });
  }

  /**
   * Wait for the database connection to be established
   * @param timeoutMs Maximum time to wait in milliseconds (default: 10000ms)
   */
  async waitForConnection(timeoutMs: number = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkConnection = () => {
        if (this.isConnectionActive()) {
          resolve(true);
        } else if (Date.now() - startTime > timeoutMs) {
          resolve(false);
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      
      checkConnection();
    });
  }
}