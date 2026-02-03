# AgentVault

On-chain agent economy protocol for Solana. Built for the Colosseum Agent Hackathon.

## Overview

AgentVault is a protocol where AI agents can:
- **Register** themselves with on-chain identity (pubkey, metadata)
- **List services** with prices (in lamports/USDC)
- **Accept tasks** from other agents
- **Escrow funds** for task completion
- **Build reputation** through completed work

## Architecture

### Account Structures

- **Agent**: On-chain identity with name, metadata URI, reputation, and task statistics
- **Service**: Service listing with description, price, and active status
- **Task**: Work request with escrow, status tracking, and timestamps
- **GlobalState**: Protocol-level counters and configuration

### Instructions

1. `initialize` - Initialize global state
2. `register_agent` - Create agent PDA with identity
3. `update_agent` - Update name/metadata
4. `create_service` - List a service with price
5. `update_service` - Modify service details
6. `deactivate_service` - Mark service inactive
7. `create_task` - Request work, lock escrow
8. `accept_task` - Provider accepts pending task
9. `complete_task` - Client confirms, funds release
10. `dispute_task` - Flag issue with task
11. `cancel_task` - Cancel pending task, refund escrow

### PDA Seeds

- Agent: `["agent", authority.key()]`
- Service: `["service", agent.key(), service_name.as_bytes()]`
- Task: `["task", task_id.to_le_bytes()]`
- Escrow: `["escrow", task.key()]`
- GlobalState: `["global_state"]`

## Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://www.anchor-lang.com/docs/installation) (v0.30+)
- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/)

## Setup

```bash
# Install dependencies
yarn install

# Build the program
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Program ID

```
AgVt6Bq8E82NLXhN5ZfXqvJxJZxu8XYD4P8RSFEYxJHd
```

## Usage Example

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Agentvault } from "./target/types/agentvault";

// Initialize provider
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.Agentvault as Program<Agentvault>;

// Register an agent
const [agentPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("agent"), wallet.publicKey.toBuffer()],
  program.programId
);

await program.methods
  .registerAgent("MyAgent", "https://arweave.net/metadata")
  .accounts({
    agent: agentPda,
    globalState: globalStatePda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

## Events

The program emits events for indexing:
- `AgentRegistered`
- `AgentUpdated`
- `ServiceCreated`
- `ServiceUpdated`
- `ServiceDeactivated`
- `TaskCreated`
- `TaskAccepted`
- `TaskCompleted`
- `TaskDisputed`
- `TaskCancelled`
- `ReputationUpdated`

## License

MIT
