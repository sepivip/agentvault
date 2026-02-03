import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Agentvault } from "../target/types/agentvault";
import { expect } from "chai";
import { PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("agentvault", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Agentvault as Program<Agentvault>;

  // Test accounts
  const clientAuthority = anchor.web3.Keypair.generate();
  const providerAuthority = anchor.web3.Keypair.generate();

  // PDAs
  let globalStatePda: PublicKey;
  let clientAgentPda: PublicKey;
  let providerAgentPda: PublicKey;
  let servicePda: PublicKey;
  let taskPda: PublicKey;
  let escrowPda: PublicKey;

  const serviceName = "code-review";
  const servicePrice = new anchor.BN(LAMPORTS_PER_SOL / 10); // 0.1 SOL

  before(async () => {
    // Airdrop SOL to test accounts
    const airdropClient = await provider.connection.requestAirdrop(
      clientAuthority.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropClient);

    const airdropProvider = await provider.connection.requestAirdrop(
      providerAuthority.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropProvider);

    // Derive PDAs
    [globalStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_state")],
      program.programId
    );

    [clientAgentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), clientAuthority.publicKey.toBuffer()],
      program.programId
    );

    [providerAgentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), providerAuthority.publicKey.toBuffer()],
      program.programId
    );

    [servicePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("service"),
        providerAgentPda.toBuffer(),
        Buffer.from(serviceName),
      ],
      program.programId
    );
  });

  describe("initialize", () => {
    it("initializes the global state", async () => {
      await program.methods
        .initialize()
        .accounts({
          globalState: globalStatePda,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const globalState = await program.account.globalState.fetch(globalStatePda);
      expect(globalState.taskCounter.toNumber()).to.equal(0);
      expect(globalState.totalTasks.toNumber()).to.equal(0);
      expect(globalState.totalAgents.toNumber()).to.equal(0);
    });
  });

  describe("register_agent", () => {
    it("registers a client agent", async () => {
      const name = "ClientBot";
      const metadataUri = "https://arweave.net/client-metadata";

      await program.methods
        .registerAgent(name, metadataUri)
        .accounts({
          agent: clientAgentPda,
          globalState: globalStatePda,
          authority: clientAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([clientAuthority])
        .rpc();

      const agent = await program.account.agent.fetch(clientAgentPda);
      expect(agent.name).to.equal(name);
      expect(agent.metadataUri).to.equal(metadataUri);
      expect(agent.reputation.toNumber()).to.equal(0);
      expect(agent.tasksCompleted.toNumber()).to.equal(0);
      expect(agent.tasksFailed.toNumber()).to.equal(0);
      expect(agent.authority.toBase58()).to.equal(clientAuthority.publicKey.toBase58());
    });

    it("registers a provider agent", async () => {
      const name = "ProviderBot";
      const metadataUri = "https://arweave.net/provider-metadata";

      await program.methods
        .registerAgent(name, metadataUri)
        .accounts({
          agent: providerAgentPda,
          globalState: globalStatePda,
          authority: providerAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([providerAuthority])
        .rpc();

      const agent = await program.account.agent.fetch(providerAgentPda);
      expect(agent.name).to.equal(name);
      expect(agent.authority.toBase58()).to.equal(providerAuthority.publicKey.toBase58());

      // Check global state updated
      const globalState = await program.account.globalState.fetch(globalStatePda);
      expect(globalState.totalAgents.toNumber()).to.equal(2);
    });

    it("fails with empty name", async () => {
      const emptyNameAuthority = anchor.web3.Keypair.generate();
      await provider.connection.requestAirdrop(
        emptyNameAuthority.publicKey,
        LAMPORTS_PER_SOL
      );

      const [emptyNameAgentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("agent"), emptyNameAuthority.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .registerAgent("", "https://metadata.uri")
          .accounts({
            agent: emptyNameAgentPda,
            globalState: globalStatePda,
            authority: emptyNameAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([emptyNameAuthority])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("AgentNameEmpty");
      }
    });
  });

  describe("update_agent", () => {
    it("updates agent name", async () => {
      const newName = "UpdatedClientBot";

      await program.methods
        .updateAgent(newName, null)
        .accounts({
          agent: clientAgentPda,
          authority: clientAuthority.publicKey,
        })
        .signers([clientAuthority])
        .rpc();

      const agent = await program.account.agent.fetch(clientAgentPda);
      expect(agent.name).to.equal(newName);
    });

    it("updates agent metadata URI", async () => {
      const newUri = "https://arweave.net/updated-metadata";

      await program.methods
        .updateAgent(null, newUri)
        .accounts({
          agent: clientAgentPda,
          authority: clientAuthority.publicKey,
        })
        .signers([clientAuthority])
        .rpc();

      const agent = await program.account.agent.fetch(clientAgentPda);
      expect(agent.metadataUri).to.equal(newUri);
    });
  });

  describe("create_service", () => {
    it("creates a service listing", async () => {
      const description = "Expert code review service for Solana programs";

      await program.methods
        .createService(serviceName, description, servicePrice)
        .accounts({
          service: servicePda,
          agent: providerAgentPda,
          authority: providerAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([providerAuthority])
        .rpc();

      const service = await program.account.service.fetch(servicePda);
      expect(service.name).to.equal(serviceName);
      expect(service.description).to.equal(description);
      expect(service.price.toNumber()).to.equal(servicePrice.toNumber());
      expect(service.active).to.be.true;
      expect(service.agent.toBase58()).to.equal(providerAgentPda.toBase58());
    });

    it("fails with zero price", async () => {
      const [zeroServicePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("service"),
          providerAgentPda.toBuffer(),
          Buffer.from("free-service"),
        ],
        program.programId
      );

      try {
        await program.methods
          .createService("free-service", "A free service", new anchor.BN(0))
          .accounts({
            service: zeroServicePda,
            agent: providerAgentPda,
            authority: providerAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([providerAuthority])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("InvalidPrice");
      }
    });
  });

  describe("update_service", () => {
    it("updates service price", async () => {
      const newPrice = new anchor.BN(LAMPORTS_PER_SOL / 5); // 0.2 SOL

      await program.methods
        .updateService(null, newPrice)
        .accounts({
          service: servicePda,
          agent: providerAgentPda,
          authority: providerAuthority.publicKey,
        })
        .signers([providerAuthority])
        .rpc();

      const service = await program.account.service.fetch(servicePda);
      expect(service.price.toNumber()).to.equal(newPrice.toNumber());
    });

    it("updates service description", async () => {
      const newDescription = "Premium code review with detailed feedback";

      await program.methods
        .updateService(newDescription, null)
        .accounts({
          service: servicePda,
          agent: providerAgentPda,
          authority: providerAuthority.publicKey,
        })
        .signers([providerAuthority])
        .rpc();

      const service = await program.account.service.fetch(servicePda);
      expect(service.description).to.equal(newDescription);
    });
  });

  describe("task lifecycle", () => {
    let currentTaskId: number;

    it("creates a task with escrow", async () => {
      const globalStateBefore = await program.account.globalState.fetch(globalStatePda);
      currentTaskId = globalStateBefore.taskCounter.toNumber() + 1;

      [taskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("task"), new anchor.BN(currentTaskId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      [escrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), taskPda.toBuffer()],
        program.programId
      );

      const escrowAmount = new anchor.BN(LAMPORTS_PER_SOL / 5);

      await program.methods
        .createTask(escrowAmount)
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          globalState: globalStatePda,
          clientAgent: clientAgentPda,
          providerAgent: providerAgentPda,
          service: servicePda,
          clientAuthority: clientAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([clientAuthority])
        .rpc();

      const task = await program.account.task.fetch(taskPda);
      expect(task.id.toNumber()).to.equal(currentTaskId);
      expect(task.client.toBase58()).to.equal(clientAgentPda.toBase58());
      expect(task.provider.toBase58()).to.equal(providerAgentPda.toBase58());
      expect(task.escrow.toNumber()).to.equal(escrowAmount.toNumber());
      expect(task.status).to.deep.equal({ pending: {} });

      // Check escrow balance
      const escrowBalance = await provider.connection.getBalance(escrowPda);
      expect(escrowBalance).to.equal(escrowAmount.toNumber());
    });

    it("provider accepts the task", async () => {
      await program.methods
        .acceptTask()
        .accounts({
          task: taskPda,
          providerAgent: providerAgentPda,
          providerAuthority: providerAuthority.publicKey,
        })
        .signers([providerAuthority])
        .rpc();

      const task = await program.account.task.fetch(taskPda);
      expect(task.status).to.deep.equal({ inProgress: {} });
    });

    it("client completes the task and releases escrow", async () => {
      const providerBalanceBefore = await provider.connection.getBalance(
        providerAuthority.publicKey
      );
      const escrowAmount = (await program.account.task.fetch(taskPda)).escrow.toNumber();

      await program.methods
        .completeTask()
        .accounts({
          task: taskPda,
          escrow: escrowPda,
          globalState: globalStatePda,
          clientAgent: clientAgentPda,
          providerAgent: providerAgentPda,
          providerAuthority: providerAuthority.publicKey,
          clientAuthority: clientAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([clientAuthority])
        .rpc();

      const task = await program.account.task.fetch(taskPda);
      expect(task.status).to.deep.equal({ completed: {} });
      expect(task.completedAt).to.not.be.null;

      // Check provider received funds
      const providerBalanceAfter = await provider.connection.getBalance(
        providerAuthority.publicKey
      );
      expect(providerBalanceAfter).to.equal(providerBalanceBefore + escrowAmount);

      // Check provider reputation updated
      const providerAgent = await program.account.agent.fetch(providerAgentPda);
      expect(providerAgent.tasksCompleted.toNumber()).to.equal(1);
      expect(providerAgent.reputation.toNumber()).to.equal(10); // REPUTATION_PER_TASK
    });
  });

  describe("task cancellation", () => {
    let cancelTaskId: number;
    let cancelTaskPda: PublicKey;
    let cancelEscrowPda: PublicKey;

    it("creates a task to be cancelled", async () => {
      const globalStateBefore = await program.account.globalState.fetch(globalStatePda);
      cancelTaskId = globalStateBefore.taskCounter.toNumber() + 1;

      [cancelTaskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("task"), new anchor.BN(cancelTaskId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      [cancelEscrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), cancelTaskPda.toBuffer()],
        program.programId
      );

      const escrowAmount = new anchor.BN(LAMPORTS_PER_SOL / 10);

      await program.methods
        .createTask(escrowAmount)
        .accounts({
          task: cancelTaskPda,
          escrow: cancelEscrowPda,
          globalState: globalStatePda,
          clientAgent: clientAgentPda,
          providerAgent: providerAgentPda,
          service: servicePda,
          clientAuthority: clientAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([clientAuthority])
        .rpc();
    });

    it("client cancels the pending task and gets refund", async () => {
      const clientBalanceBefore = await provider.connection.getBalance(
        clientAuthority.publicKey
      );
      const escrowAmount = (await program.account.task.fetch(cancelTaskPda)).escrow.toNumber();

      await program.methods
        .cancelTask()
        .accounts({
          task: cancelTaskPda,
          escrow: cancelEscrowPda,
          clientAgent: clientAgentPda,
          clientAuthority: clientAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([clientAuthority])
        .rpc();

      const task = await program.account.task.fetch(cancelTaskPda);
      expect(task.status).to.deep.equal({ cancelled: {} });
      expect(task.escrow.toNumber()).to.equal(0);

      // Check client received refund (minus tx fees)
      const clientBalanceAfter = await provider.connection.getBalance(
        clientAuthority.publicKey
      );
      // Balance should be approximately the same (refund minus small tx fee)
      expect(clientBalanceAfter).to.be.greaterThan(clientBalanceBefore - 10000);
    });
  });

  describe("task dispute", () => {
    let disputeTaskId: number;
    let disputeTaskPda: PublicKey;
    let disputeEscrowPda: PublicKey;

    it("creates and accepts a task to be disputed", async () => {
      const globalStateBefore = await program.account.globalState.fetch(globalStatePda);
      disputeTaskId = globalStateBefore.taskCounter.toNumber() + 1;

      [disputeTaskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("task"), new anchor.BN(disputeTaskId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      [disputeEscrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), disputeTaskPda.toBuffer()],
        program.programId
      );

      const escrowAmount = new anchor.BN(LAMPORTS_PER_SOL / 10);

      // Create task
      await program.methods
        .createTask(escrowAmount)
        .accounts({
          task: disputeTaskPda,
          escrow: disputeEscrowPda,
          globalState: globalStatePda,
          clientAgent: clientAgentPda,
          providerAgent: providerAgentPda,
          service: servicePda,
          clientAuthority: clientAuthority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([clientAuthority])
        .rpc();

      // Accept task
      await program.methods
        .acceptTask()
        .accounts({
          task: disputeTaskPda,
          providerAgent: providerAgentPda,
          providerAuthority: providerAuthority.publicKey,
        })
        .signers([providerAuthority])
        .rpc();
    });

    it("client disputes the in-progress task", async () => {
      await program.methods
        .disputeTask()
        .accounts({
          task: disputeTaskPda,
          disputerAgent: clientAgentPda,
          disputerAuthority: clientAuthority.publicKey,
        })
        .signers([clientAuthority])
        .rpc();

      const task = await program.account.task.fetch(disputeTaskPda);
      expect(task.status).to.deep.equal({ disputed: {} });
    });
  });

  describe("deactivate_service", () => {
    it("deactivates a service", async () => {
      await program.methods
        .deactivateService()
        .accounts({
          service: servicePda,
          agent: providerAgentPda,
          authority: providerAuthority.publicKey,
        })
        .signers([providerAuthority])
        .rpc();

      const service = await program.account.service.fetch(servicePda);
      expect(service.active).to.be.false;
    });

    it("fails to create task with inactive service", async () => {
      const globalStateBefore = await program.account.globalState.fetch(globalStatePda);
      const failTaskId = globalStateBefore.taskCounter.toNumber() + 1;

      const [failTaskPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("task"), new anchor.BN(failTaskId).toArrayLike(Buffer, "le", 8)],
        program.programId
      );

      const [failEscrowPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("escrow"), failTaskPda.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .createTask(new anchor.BN(LAMPORTS_PER_SOL / 10))
          .accounts({
            task: failTaskPda,
            escrow: failEscrowPda,
            globalState: globalStatePda,
            clientAgent: clientAgentPda,
            providerAgent: providerAgentPda,
            service: servicePda,
            clientAuthority: clientAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([clientAuthority])
          .rpc();
        expect.fail("Should have thrown an error");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("ServiceNotActive");
      }
    });
  });
});
