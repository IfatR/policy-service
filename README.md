# TypeScript Policy Managemnt Service

## Features

### Core TypeScript Features
- TypeScript compilation
- Basic type annotations
- Interface usage
- Array operations
- Function declarations

### AWS IoT Policy Distribution
- 🔐 **Policy Management**: Create, validate, and manage agent policies
- 📡 **IoT Core Integration**: Distribute policies via AWS IoT MQTT topics
- 👥 **Agent Management**: Discover and manage IoT devices/agents
- 🔄 **Real-time Distribution**: Push policy updates to connected agents
- 📊 **Result Tracking**: Monitor distribution success/failure
- 🛡️ **Security Policies**: Predefined security, monitoring, and data collection policies

## Prerequisites

- Node.js (version 16 or higher)
- npm (comes with Node.js)
- AWS Account with IoT Core access
- AWS CLI configured or environment variables set

## Getting Started

### 1. Install Dependencies
```powershell
npm install
```

### 2. Configure AWS Credentials
Copy the example environment file and configure your AWS settings:
```powershell
copy .env.example .env
```

Edit `.env` file with your AWS credentials and IoT endpoint:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
IOT_ENDPOINT=your-iot-endpoint.iot.us-east-1.amazonaws.com
IOT_TOPIC_PREFIX=agents/policies
```

### 3. Build and Run
```powershell
# Build the project
npm run build

# Run the main application
npm start

# Build and run in one step
npm run dev

# Run the policy distribution example
npm run example
```

## Project Structure

```
├── src/
│   ├── index.ts                    # Main application entry point
│   ├── iot-policy-distributor.ts   # AWS IoT Core policy distribution logic
│   ├── policy-manager.ts           # Policy creation and management utilities
│   └── example.ts                  # Comprehensive usage examples
├── dist/                           # Compiled JavaScript output (generated)
├── .env.example                    # Environment variables template
├── package.json                    # Project configuration and dependencies
├── tsconfig.json                   # TypeScript compiler configuration
└── README.md                       # This file
```

## AWS IoT Setup

### 1. Create IoT Things (Agents)
Create IoT Things in AWS IoT Core to represent your agents:
```bash
aws iot create-thing --thing-name agent-001 --attribute-payload attributes="{\"agentType\":\"policy-agent\",\"name\":\"Sensor Agent 001\",\"capabilities\":\"temperature,humidity\"}"
```

### 2. Set up MQTT Topics
The system uses the following topic structure:
- `agents/policies/{agentId}/update` - Policy updates to specific agents
- `agents/policies/{agentId}/revoke` - Policy revocations

### 3. Configure IoT Policies
Create IoT policies that allow your agents to subscribe to policy topics:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iot:Connect",
        "iot:Subscribe",
        "iot:Receive"
      ],
      "Resource": [
        "arn:aws:iot:region:account:client/agent-*",
        "arn:aws:iot:region:account:topicfilter/agents/policies/agent-*/update",
        "arn:aws:iot:region:account:topicfilter/agents/policies/agent-*/revoke"
      ]
    }
  ]
}
```

## Policy Types

### 1. Security Policy
- Authentication requirements
- Rate limiting
- Threat protection

### 2. Monitoring Policy  
- Health checks
- Resource usage monitoring
- Error reporting

### 3. Data Collection Policy
- Telemetry collection frequency
- Sensor data handling
- Log retention and compression

## Usage Examples

### Basic Policy Distribution
```typescript
import { IoTPolicyDistributor, PolicyManager } from './src/iot-policy-distributor';

const distributor = new IoTPolicyDistributor();
const policy = PolicyManager.createSecurityPolicy();

// Distribute to single agent
const result = await distributor.distributePolicyToAgent('agent-001', policy);

// Distribute to multiple agents
const results = await distributor.distributePolicyToAgents(['agent-001', 'agent-002'], policy);
```

### Policy Management
```typescript
import { PolicyManager } from './src/policy-manager';

// Create predefined policies
const securityPolicy = PolicyManager.createSecurityPolicy();
const monitoringPolicy = PolicyManager.createMonitoringPolicy();

// Validate policy
const validation = PolicyManager.validatePolicy(securityPolicy);

// Merge multiple policies
const mergedPolicy = PolicyManager.mergePolicies([securityPolicy, monitoringPolicy], 'combined-v1');
```

## Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the main compiled application
- `npm run dev` - Build and run the main application
- `npm run example` - Run the comprehensive policy distribution example
- `npm run clean` - Remove the dist folder

## What This Project Demonstrates

### TypeScript Features
- **Type Safety**: Variables and functions with explicit types
- **Interfaces**: Defining object shapes and contracts
- **Modern JavaScript**: ES2020 features with TypeScript
- **Async/Await**: Asynchronous programming patterns

### AWS IoT Integration
- **MQTT Communication**: Publishing messages to IoT Core topics
- **Thing Management**: Listing and managing IoT devices
- **Policy Distribution**: Real-time policy updates to agents
- **Error Handling**: Robust error handling and logging

### Architecture Patterns
- **Separation of Concerns**: Modular code organization
- **Configuration Management**: Environment-based configuration
- **Validation**: Input validation and error checking
- **Extensibility**: Easy to extend with new policy types

## Troubleshooting

### Common Issues
1. **AWS Credentials**: Ensure your AWS credentials are properly configured
2. **IoT Endpoint**: Verify your IoT endpoint URL is correct
3. **Permissions**: Check that your AWS user/role has IoT permissions
4. **Network**: Ensure your network allows HTTPS/WSS connections to AWS

### Debug Mode
Set environment variable `DEBUG=true` for verbose logging:
```powershell
$env:DEBUG="true"; npm run dev
```
