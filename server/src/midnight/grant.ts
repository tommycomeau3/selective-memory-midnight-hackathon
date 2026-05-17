import type { MemoryCategory } from '../types.js';
import { categoryMask } from './category.js';
import { agentIdToBytes32, computeGrantRoot } from './commitments.js';
import { getMidnightRuntime } from './wallet-runtime.js';

export interface MidnightGrantResult {
  grantRootHex: string;
  txId: string;
  blockHeight?: number;
}

/** Submit grantAgentAccess to Midnight (ZK proof via proof server + on-chain call). */
export async function submitMidnightGrant(
  agentId: string,
  allowedCategories: MemoryCategory[],
  memoryIds: string[],
  timestamp: number
): Promise<MidnightGrantResult> {
  const runtime = await getMidnightRuntime();
  const grantRoot = computeGrantRoot(memoryIds, timestamp);

  const tx = await runtime.deployed.callTx.grantAgentAccess(
    agentIdToBytes32(agentId),
    BigInt(categoryMask(allowedCategories)),
    grantRoot,
    BigInt(timestamp)
  );

  return {
    grantRootHex: Buffer.from(grantRoot).toString('hex'),
    txId: tx.public.txId,
    blockHeight: tx.public.blockHeight,
  };
}
