#!/usr/bin/env tsx

/**
 * Enterprise Logging System Example
 * 
 * This example demonstrates the government-grade logging features
 * including named transports, level filtering, and separation of concerns.
 */

import { Flog, LogLevel, ConsoleTransport } from './src/index';

// Example: Government Security System
class SecurityService {
  // Uses default transports from config (console + audit + general)
  private log = new Flog('SecurityService');

  authenticateUser(userId: string) {
    this.log.info(`User ${userId} authentication attempt`);
    
    // Simulate authentication logic
    const isValid = Math.random() > 0.3;
    
    if (isValid) {
      this.log.info(`User ${userId} authenticated successfully`);
    } else {
      // Security alerts go to errors transport (ERROR/WARN only)
      this.log.error(`Failed authentication for user ${userId}`, {
        transports: ['errors', 'console', 'audit'],
        metadata: { userId, timestamp: Date.now(), severity: 'HIGH' }
      });
    }
  }
}

// Example: Payment Processing (High-Security)
class PaymentProcessor {
  // Override defaults to use only secure transports
  private log = new Flog('PaymentProcessor', undefined, undefined, ['audit', 'errors']);

  processPayment(amount: number, userId: string) {
    this.log.info(`Processing payment of $${amount} for user ${userId}`);
    
    try {
      // Simulate payment processing
      if (amount > 10000) {
        // Large transactions get extra logging
        this.log.warn(`Large transaction detected: $${amount}`, {
          transports: ['errors', 'audit', 'console'],
          metadata: { amount, userId, flagged: true }
        });
      }
      
      this.log.info(`Payment of $${amount} processed successfully`);
    } catch (error) {
      this.log.error(`Payment processing failed: ${error}`, {
        metadata: { amount, userId, error: error }
      });
    }
  }
}

// Example: Debug Service (Development)
class DebugService {
  // Debug-focused logging
  private log = new Flog('DebugService', undefined, undefined, ['debug', 'console']);

  analyzePerformance() {
    this.log.debug('Starting performance analysis');
    this.log.trace('Memory usage: 45MB');
    this.log.trace('CPU usage: 12%');
    this.log.debug('Performance analysis complete');
  }
}

// Example: API Gateway (Mixed Outputs)
class ApiGateway {
  private log = new Flog('ApiGateway');

  handleRequest(endpoint: string, method: string) {
    // Normal request logging (uses defaults)
    this.log.info(`${method} ${endpoint}`);
    
    // Simulate different scenarios
    const scenario = Math.random();
    
    if (scenario > 0.8) {
      // Critical errors need immediate attention
      this.log.error(`Service unavailable for ${endpoint}`, {
        transports: ['errors', 'console'],
        metadata: { endpoint, method, code: 503 }
      });
    } else if (scenario > 0.6) {
      // Rate limiting warnings
      this.log.warn(`Rate limit approaching for endpoint ${endpoint}`, {
        transports: ['errors', 'general'],
        metadata: { endpoint, method, remaining: 5 }
      });
    } else {
      // Successful requests with custom transport
      const customConsole = new ConsoleTransport('api-console');
      this.log.info(`Request completed successfully`, {
        transports: [customConsole, 'audit'],
        metadata: { endpoint, method, duration: '45ms' }
      });
    }
  }
}

// Demonstration
async function demonstrateEnterpriseLogging() {
  console.log('🏛️  Enterprise Logging System Demonstration\\n');
  
  const security = new SecurityService();
  const payments = new PaymentProcessor();
  const debug = new DebugService();
  const api = new ApiGateway();

  console.log('📋 Security Service:');
  security.authenticateUser('john.doe');
  security.authenticateUser('admin');
  
  console.log('\\n💳 Payment Processing:');
  payments.processPayment(150.00, 'john.doe');
  payments.processPayment(15000.00, 'big.spender');
  
  console.log('\\n🔍 Debug Analysis:');
  debug.analyzePerformance();
  
  console.log('\\n🌐 API Gateway:');
  api.handleRequest('/api/users', 'GET');
  api.handleRequest('/api/payments', 'POST');
  api.handleRequest('/api/admin', 'DELETE');
  
  console.log('\\n✅ Demonstration complete!');
  console.log('\\n📁 Check the following log files:');
  console.log('   • ./logs/errors.log - Only ERROR and WARN messages');
  console.log('   • ./logs/audit.json - Structured logs (no DEBUG/TRACE)');
  console.log('   • ./logs/debug.log - Only DEBUG and TRACE messages');
  console.log('   • ./logs/app.log - All log messages');
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateEnterpriseLogging().catch(console.error);
}

export { demonstrateEnterpriseLogging };