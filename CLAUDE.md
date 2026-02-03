# CLAUDE.md

This file provides guidance for Claude Code when working with this repository.

## Project Overview

AgentVault is an on-chain agent economy protocol built on Solana using the Anchor framework. It enables AI agents to register identities, list services, accept tasks, escrow funds, and build reputation through completed work. Built for the Colosseum Agent Hackathon.

## Tech Stack

- **Blockchain**: Solana
- **Framework**: Anchor 0.30+
- **Language**: Rust (programs), TypeScript (tests/client)
- **Testing**: ts-mocha with Anchor testing utilities

## Project Structure

```
agentvault/
├── programs/agentvault/src/
│   ├── lib.rs              # Main program entry, instruction dispatch
│   ├── state.rs            # Account structures (Agent, Service, Task, GlobalState)
│   ├── errors.rs           # Custom error codes
│   ├── events.rs           # Event definitions for indexing
│   └── instructions/       # Instruction handlers
│       ├── mod.rs
│       ├── initialize.rs
│       ├── register_agent.rs
│       ├── update_agent.rs
│       ├── create_service.rs
│       ├── update_service.rs
│       ├── deactivate_service.rs
│       ├── create_task.rs
│       ├── accept_task.rs
│       ├── complete_task.rs
│       ├── dispute_task.rs
│       └── cancel_task.rs
├── tests/
│   └── agentvault.ts       # TypeScript integration tests
├── Anchor.toml             # Anchor configuration
├── Cargo.toml              # Rust workspace config
└── package.json            # Node dependencies
```

## Key Concepts

### Account Structures (PDAs)

| Account | Seeds | Purpose |
|---------|-------|---------|
| Agent | `["agent", authority.key()]` | On-chain identity with reputation |
| Service | `["service", agent.key(), service_name.as_bytes()]` | Service listing with price |
| Task | `["task", task_id.to_le_bytes()]` | Work request with escrow |
| Escrow | `["escrow", task.key()]` | Holds locked funds |
| GlobalState | `["global_state"]` | Protocol counters and config |

### Task Status Flow

```
Pending → InProgress → Completed
    ↓         ↓
Cancelled  Disputed
```

### Program ID

```
AgVt6Bq8E82NLXhN5ZfXqvJxJZxu8XYD4P8RSFEYxJHd
```

## Common Commands

```bash
# Install dependencies
yarn install

# Build the Anchor program
anchor build

# Run tests (localnet)
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run tests against devnet
anchor test --provider.cluster devnet
```

## Development Guidelines

### Anchor Patterns

- Use `#[account]` macro for account structures
- Use `#[derive(Accounts)]` for instruction context
- Validate with Anchor constraints (`#[account(constraint = ...)]`)
- Emit events for off-chain indexing

### String Limits

- Agent name: max 32 characters
- Service name: max 64 characters
- Service description: max 256 characters
- Metadata URI: IPFS/Arweave links for extended data

### Testing

Tests are in TypeScript using `@coral-xyz/anchor`. Run with:
```bash
anchor test
```

The test file at `tests/agentvault.ts` covers the full instruction set.

## Events

The program emits these events for indexers:
- `AgentRegistered`, `AgentUpdated`
- `ServiceCreated`, `ServiceUpdated`, `ServiceDeactivated`
- `TaskCreated`, `TaskAccepted`, `TaskCompleted`, `TaskDisputed`, `TaskCancelled`
- `ReputationUpdated`
