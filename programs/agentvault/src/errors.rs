use anchor_lang::prelude::*;

#[error_code]
pub enum AgentVaultError {
    #[msg("Agent name exceeds maximum length of 32 characters")]
    AgentNameTooLong,

    #[msg("Service name exceeds maximum length of 64 characters")]
    ServiceNameTooLong,

    #[msg("Service description exceeds maximum length of 256 characters")]
    ServiceDescriptionTooLong,

    #[msg("Metadata URI exceeds maximum length of 200 characters")]
    MetadataUriTooLong,

    #[msg("Service is not active")]
    ServiceNotActive,

    #[msg("Invalid task status for this operation")]
    InvalidTaskStatus,

    #[msg("Unauthorized: caller is not the authority")]
    Unauthorized,

    #[msg("Task is not in pending status")]
    TaskNotPending,

    #[msg("Task is not in progress")]
    TaskNotInProgress,

    #[msg("Client cannot be the same as provider")]
    ClientCannotBeProvider,

    #[msg("Insufficient funds for escrow")]
    InsufficientFunds,

    #[msg("Escrow amount must be greater than zero")]
    InvalidEscrowAmount,

    #[msg("Task already accepted")]
    TaskAlreadyAccepted,

    #[msg("Only client can confirm completion")]
    OnlyClientCanConfirm,

    #[msg("Only provider can mark as complete")]
    OnlyProviderCanComplete,

    #[msg("Arithmetic overflow occurred")]
    ArithmeticOverflow,

    #[msg("Task cannot be cancelled in current status")]
    TaskCannotBeCancelled,

    #[msg("Only participants can dispute")]
    OnlyParticipantsCanDispute,

    #[msg("Price must be greater than zero")]
    InvalidPrice,

    #[msg("Agent name cannot be empty")]
    AgentNameEmpty,

    #[msg("Service name cannot be empty")]
    ServiceNameEmpty,
}
