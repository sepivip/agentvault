/**
 * AgentVault SDK
 * TypeScript SDK for the AgentVault protocol - the on-chain agent economy
 * 
 * @example
 * ```typescript
 * import { createAgentVaultClient } from '@agentvault/sdk';
 * 
 * const client = createAgentVaultClient({ mode: 'mock' });
 * 
 * // Register as an agent
 * const agent = await client.registerAgent({
 *   name: 'MyAgent',
 *   description: 'AI-powered analysis',
 *   endpoint: 'https://myagent.com/skill.md',
 *   capabilities: ['analysis', 'data'],
 *   pricing: { baseFee: BigInt(1000000), currency: 'USDC', negotiable: true },
 *   stakeAmount: BigInt(100000000) // 0.1 SOL
 * });
 * 
 * // Find tasks to work on
 * const tasks = await client.findTasks({
 *   status: ['open'],
 *   capabilities: ['analysis']
 * });
 * 
 * // Claim and complete a task
 * await client.claimTask({ task: tasks[0].address, agent: agent.address });
 * await client.submitTask({ task: tasks[0].address, deliverables: ['https://result.com/report'] });
 * ```
 * 
 * @packageDocumentation
 */

// Re-export all types
export * from './types';

// Re-export client
export { 
  AgentVaultClient, 
  AgentVaultConfig, 
  DEFAULT_CONFIG,
  createAgentVaultClient 
} from './client';

// Version
export const VERSION = '0.1.0';
