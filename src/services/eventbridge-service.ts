import { EventBridgeClient, PutEventsCommand, PutEventsCommandInput, PutEventsRequestEntry } from '@aws-sdk/client-eventbridge';
import { PolicyDocument } from '../model/policy-types';

/**
 * EventBridge service for publishing policy events to AWS EventBridge
 */
export class EventBridgeService {
  private client: EventBridgeClient;
  private eventBusName: string;
  private source: string;
  private enabled: boolean;

  constructor() {
    this.eventBusName = process.env.AWS_EVENTBRIDGE_BUS_NAME || 'default';
    this.source = process.env.AWS_EVENTBRIDGE_SOURCE || 'policy-service';
    this.enabled = process.env.AWS_EVENTBRIDGE_ENABLED === 'true';
    
    // Initialize EventBridge client
    this.client = new EventBridgeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      } : undefined, // Use IAM role if no explicit credentials
    });
  }

  /**
   * Publish policy created event
   */
  async publishPolicyCreated(policyDocument: PolicyDocument): Promise<void> {
    if (!this.enabled) {
      console.log('📢 EventBridge disabled - Policy created event not published');
      return;
    }

    const event: PutEventsRequestEntry = {
      Source: this.source,
      DetailType: 'Policy Created',
      Detail: JSON.stringify({
        eventType: 'POLICY_CREATED',
        policyId: policyDocument.policy.PolicyId,
        tenantId: policyDocument.policy.tenantId,
        version: policyDocument.policy.version,
        location: policyDocument.policy.location,
        status: policyDocument.policy.status || 'AC',
        rulesCount: Object.keys(policyDocument.policy.rules || {}).length,
        groupsCount: Object.keys(policyDocument.policy.assignments?.groups || {}).length,
        usersCount: Object.keys(policyDocument.policy.assignments?.users || {}).length,
        timestamp: new Date().toISOString(),
        metadata: {
          service: 'policy-service',
          action: 'create'
        }
      }),
      EventBusName: this.eventBusName
    };

    await this.publishEvent(event, 'Policy Created');
  }

  /**
   * Publish policy updated event
   */
  async publishPolicyUpdated(policyId: string, updatedPolicy: PolicyDocument, changes?: Partial<PolicyDocument>): Promise<void> {
    if (!this.enabled) {
      console.log('📢 EventBridge disabled - Policy updated event not published');
      return;
    }

    const event: PutEventsRequestEntry = {
      Source: this.source,
      DetailType: 'Policy Updated',
      Detail: JSON.stringify({
        eventType: 'POLICY_UPDATED',
        policyId: policyId,
        tenantId: updatedPolicy.policy.tenantId,
        version: updatedPolicy.policy.version,
        location: updatedPolicy.policy.location,
        status: updatedPolicy.policy.status || 'AC',
        rulesCount: Object.keys(updatedPolicy.policy.rules || {}).length,
        groupsCount: Object.keys(updatedPolicy.policy.assignments?.groups || {}).length,
        usersCount: Object.keys(updatedPolicy.policy.assignments?.users || {}).length,
        changes: changes || null,
        timestamp: new Date().toISOString(),
        metadata: {
          service: 'policy-service',
          action: 'update'
        }
      }),
      EventBusName: this.eventBusName
    };

    await this.publishEvent(event, 'Policy Updated');
  }

  /**
   * Publish policy deleted event (soft delete)
   */
  async publishPolicyDeleted(policyId: string, tenantId: string): Promise<void> {
    if (!this.enabled) {
      console.log('📢 EventBridge disabled - Policy deleted event not published');
      return;
    }

    const event: PutEventsRequestEntry = {
      Source: this.source,
      DetailType: 'Policy Deleted',
      Detail: JSON.stringify({
        eventType: 'POLICY_DELETED',
        policyId: policyId,
        tenantId: tenantId,
        status: 'DL',
        timestamp: new Date().toISOString(),
        metadata: {
          service: 'policy-service',
          action: 'delete'
        }
      }),
      EventBusName: this.eventBusName
    };

    await this.publishEvent(event, 'Policy Deleted');
  }

  /**
   * Generic method to publish events to EventBridge
   */
  private async publishEvent(event: PutEventsRequestEntry, eventName: string): Promise<void> {
    try {
      const params: PutEventsCommandInput = {
        Entries: [event]
      };

      const command = new PutEventsCommand(params);
      const result = await this.client.send(command);

      if (result.FailedEntryCount && result.FailedEntryCount > 0) {
        console.error(`❌ Failed to publish ${eventName} event:`, result.Entries?.[0]?.ErrorMessage);
      } else {
        console.log(`📢 Successfully published ${eventName} event to EventBridge`);
      }
    } catch (error) {
      console.error(`❌ Error publishing ${eventName} event to EventBridge:`, error);
      // Don't throw error - we don't want EventBridge failures to break the main flow
    }
  }

  /**
   * Test EventBridge connectivity
   */
  async testConnection(): Promise<boolean> {
    if (!this.enabled) {
      console.log('📢 EventBridge disabled - skipping connection test');
      return true;
    }

    try {
      const testEvent: PutEventsRequestEntry = {
        Source: this.source,
        DetailType: 'Connection Test',
        Detail: JSON.stringify({
          eventType: 'CONNECTION_TEST',
          timestamp: new Date().toISOString(),
          service: 'policy-service'
        }),
        EventBusName: this.eventBusName
      };

      const params: PutEventsCommandInput = {
        Entries: [testEvent]
      };

      const command = new PutEventsCommand(params);
      const result = await this.client.send(command);

      if (result.FailedEntryCount && result.FailedEntryCount > 0) {
        console.error('❌ EventBridge connection test failed:', result.Entries?.[0]?.ErrorMessage);
        return false;
      } else {
        console.log('✅ EventBridge connection test successful');
        return true;
      }
    } catch (error) {
      console.error('❌ EventBridge connection test error:', error);
      return false;
    }
  }

  /**
   * Check if EventBridge is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get EventBridge configuration info
   */
  getConfig(): {
    enabled: boolean;
    eventBusName: string;
    source: string;
    region: string;
  } {
    return {
      enabled: this.enabled,
      eventBusName: this.eventBusName,
      source: this.source,
      region: process.env.AWS_REGION || 'us-east-1'
    };
  }
}