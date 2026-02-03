# AgentVault - Anchor Program

Build a Solana Anchor program for an **on-chain agent economy**. This is for the Colosseum Agent Hackathon (deadline Feb 12).

## Core Concept

AgentVault is a protocol where AI agents can:
1. **Register** themselves with on-chain identity (pubkey, metadata)
2. **List services** with prices (in USDC)
3. **Accept tasks** from other agents
4. **Escrow funds** for task completion
5. **Build reputation** through completed work

## Data Structures

```rust
#[account]
pub struct Agent {
    pub authority: Pubkey,      // Owner wallet
    pub name: String,           // Max 32 chars
    pub metadata_uri: String,   // IPFS/Arweave link to extended metadata
    pub reputation: u64,        // Earned through completed tasks
    pub tasks_completed: u64,
    pub tasks_failed: u64,
    pub created_at: i64,
    pub bump: u8,
}

#[account]
pub struct Service {
    pub agent: Pubkey,          // PDA of agent offering this
    pub name: String,           // Max 64 chars
    pub description: String,    // Max 256 chars  
    pub price: u64,             // In lamports (or USDC later)
    pub active: bool,
    pub bump: u8,
}

#[account]  
pub struct Task {
    pub id: u64,
    pub client: Pubkey,         // Agent requesting work
    pub provider: Pubkey,       // Agent doing work
    pub service: Pubkey,        // Service being used
    pub escrow: u64,            // Amount locked
    pub status: TaskStatus,     // Pending/InProgress/Completed/Disputed
    pub created_at: i64,
    pub completed_at: Option<i64>,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    Disputed,
    Cancelled,
}
```

## Instructions

1. **register_agent** - Create agent PDA, initialize reputation
2. **update_agent** - Update name/metadata
3. **create_service** - List a service with price
4. **update_service** - Modify service details
5. **deactivate_service** - Mark service inactive
6. **create_task** - Request work, lock escrow
7. **accept_task** - Provider accepts pending task
8. **complete_task** - Provider marks complete, client confirms, funds release
9. **dispute_task** - Either party flags issue
10. **cancel_task** - Cancel pending task, refund escrow

## PDAs

- Agent: `["agent", authority.key()]`
- Service: `["service", agent.key(), service_name.as_bytes()]`
- Task: `["task", task_id.to_le_bytes()]`

## Requirements

- Use Anchor 0.30+ syntax
- Deploy target: devnet first, then mainnet
- Include basic tests in TypeScript
- Error handling with custom error codes
- Events for indexing (AgentRegistered, TaskCreated, TaskCompleted, etc.)

## Project Structure

```
agentvault/
├── programs/
│   └── agentvault/
│       └── src/
│           ├── lib.rs           # Main program
│           ├── state.rs         # Account structures  
│           ├── instructions/    # Instruction handlers
│           └── errors.rs        # Custom errors
├── tests/
│   └── agentvault.ts
├── Anchor.toml
└── Cargo.toml
```

## Deploy Commands

```bash
anchor build
anchor test
anchor deploy --provider.cluster devnet
```

Go! Build the full program. Make it clean and production-ready.
