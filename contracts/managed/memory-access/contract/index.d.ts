import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  grantAgentAccess(context: __compactRuntime.CircuitContext<PS>,
                   agentId_0: Uint8Array,
                   categoryMask_0: bigint,
                   grantRoot_0: Uint8Array,
                   timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  grantAgentAccess(context: __compactRuntime.CircuitContext<PS>,
                   agentId_0: Uint8Array,
                   categoryMask_0: bigint,
                   grantRoot_0: Uint8Array,
                   timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  grantAgentAccess(context: __compactRuntime.CircuitContext<PS>,
                   agentId_0: Uint8Array,
                   categoryMask_0: bigint,
                   grantRoot_0: Uint8Array,
                   timestamp_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly lastAgentId: Uint8Array;
  readonly lastCategoryMask: bigint;
  readonly lastGrantRoot: Uint8Array;
  readonly lastTimestamp: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
