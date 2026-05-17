import { Buffer } from 'node:buffer';
import { firstValueFrom } from 'rxjs';
import { WebSocket } from 'ws';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import * as ledger from '@midnight-ntwrk/ledger-v8';
import { WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import { DustWallet } from '@midnight-ntwrk/wallet-sdk-dust-wallet';
import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import {
  createKeystore,
  NoOpTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { getContractAddress, getNetworkConfig, getWalletSeed, midnightConfig } from './config.js';
import { getCompiledContract, getZkConfigPath } from './contract-loader.js';
import { waitForWalletSynced } from './wallet-sync.js';

// @ts-expect-error wallet SDK expects WebSocket global
globalThis.WebSocket = WebSocket;

export type DeployedMemoryAccess = Awaited<ReturnType<typeof findDeployedContract>>;

export interface MidnightRuntime {
  providers: MidnightProviders;
  deployed: DeployedMemoryAccess;
  wallet: WalletFacade;
  stop: () => Promise<void>;
}

let runtimePromise: Promise<MidnightRuntime> | null = null;

function deriveKeys(seed: string) {
  const normalized = seed.trim();
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error(
      'Invalid MIDNIGHT_WALLET_SEED: expected 64 hex characters (32 bytes). Run: npm run deploy:midnight -w server'
    );
  }
  const hdWallet = HDWallet.fromSeed(Buffer.from(normalized, 'hex'));
  if (hdWallet.type !== 'seedOk') {
    throw new Error('Invalid MIDNIGHT_WALLET_SEED: HD wallet rejected seed bytes');
  }
  const result = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (result.type !== 'keysDerived') throw new Error('Key derivation failed');
  hdWallet.hdWallet.clear();
  return result.keys;
}

async function createWallet(seed: string) {
  const network = getNetworkConfig();
  setNetworkId(network.networkId);

  const keys = deriveKeys(seed);
  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(keys[Roles.NightExternal], network.networkId);

  const wallet = await WalletFacade.init({
    configuration: {
      networkId: network.networkId,
      indexerClientConnection: {
        indexerHttpUrl: network.indexer,
        indexerWsUrl: network.indexerWS,
      },
      provingServerUrl: new URL(network.proofServer),
      relayURL: new URL(network.node.replace(/^http/, 'ws')),
      txHistoryStorage: new NoOpTransactionHistoryStorage(),
      costParameters: {
        additionalFeeOverhead: 300_000_000_000_000n,
        feeBlocksMargin: 5,
      },
    },
    shielded: async (config) => ShieldedWallet(config).startWithSecretKeys(shieldedSecretKeys),
    unshielded: async (config) =>
      UnshieldedWallet(config).startWithPublicKey(PublicKey.fromKeyStore(unshieldedKeystore)),
    dust: async (config) =>
      DustWallet(config).startWithSecretKey(
        dustSecretKey,
        ledger.LedgerParameters.initialParameters().dust
      ),
  });

  console.log('Starting wallet (connecting to indexer + RPC)...');
  await wallet.start(shieldedSecretKeys, dustSecretKey);

  return { wallet, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
}

async function buildProviders(
  walletCtx: Awaited<ReturnType<typeof createWallet>>
): Promise<MidnightProviders> {
  const network = getNetworkConfig();
  const address = walletCtx.unshieldedKeystore.getBech32Address().toString();
  await waitForWalletSynced(walletCtx.wallet, address);
  const state = await firstValueFrom(walletCtx.wallet.state());
  const zkConfigPath = getZkConfigPath();

  const walletProvider = {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () => state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: unknown, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx as never,
        {
          shieldedSecretKeys: walletCtx.shieldedSecretKeys,
          dustSecretKey: walletCtx.dustSecretKey,
        },
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) }
      );
      const signedRecipe = await walletCtx.wallet.signRecipe(recipe, (payload) =>
        walletCtx.unshieldedKeystore.signData(payload)
      );
      return walletCtx.wallet.finalizeRecipe(signedRecipe);
    },
    submitTx: (tx: unknown) => walletCtx.wallet.submitTransaction(tx as never) as never,
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'selective-memory-ai',
      accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
      privateStoragePasswordProvider: () => midnightConfig.privateStatePassword,
    }),
    publicDataProvider: indexerPublicDataProvider(network.indexer, network.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(network.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

async function initRuntime(): Promise<MidnightRuntime> {
  const walletSeed = getWalletSeed();
  const contractAddress = getContractAddress();
  if (!walletSeed) {
    throw new Error('MIDNIGHT_WALLET_SEED missing. Run: npm run deploy:midnight -w server');
  }
  if (!contractAddress) {
    throw new Error('MIDNIGHT_CONTRACT_ADDRESS missing. Run: npm run deploy:midnight -w server');
  }

  const walletCtx = await createWallet(walletSeed);
  const providers = await buildProviders(walletCtx);
  const compiledContract = await getCompiledContract();

  const deployed = await findDeployedContract(providers, {
    compiledContract: compiledContract as never,
    contractAddress,
    privateStateId: 'selective-memory-ai',
  });

  return {
    providers,
    deployed,
    wallet: walletCtx.wallet,
    stop: () => walletCtx.wallet.stop(),
  };
}

export async function getMidnightRuntime(): Promise<MidnightRuntime> {
  if (!runtimePromise) {
    runtimePromise = initRuntime().catch((err) => {
      runtimePromise = null;
      throw err;
    });
  }
  return runtimePromise;
}

export async function deployMemoryAccessContract(): Promise<string> {
  const walletSeed = getWalletSeed();
  if (!walletSeed) {
    throw new Error('MIDNIGHT_WALLET_SEED missing. Run: npm run deploy:midnight -w server');
  }
  const walletCtx = await createWallet(walletSeed);
  try {
    const providers = await buildProviders(walletCtx);
    const compiledContract = await getCompiledContract();
    console.log('Deploying contract (ZK proof + on-chain submit)...');
    console.log(
      'No further logs for several minutes is normal — proof server is generating the ZK proof (CPU/RAM heavy).'
    );
    const deployStarted = Date.now();
    const heartbeat = setInterval(() => {
      const s = Math.round((Date.now() - deployStarted) / 1000);
      console.log(`[${s}s] Still proving / submitting… (check proof-server: docker logs -f selective-memory-proof-server)`);
    }, 60_000);
    let deployed;
    try {
      deployed = await deployContract(providers, {
        compiledContract: compiledContract as never,
        privateStateId: 'selective-memory-ai',
        initialPrivateState: {},
        args: [],
      });
    } finally {
      clearInterval(heartbeat);
    }
    console.log(`Deploy step finished in ${Math.round((Date.now() - deployStarted) / 1000)}s`);
    return deployed.deployTxData.public.contractAddress;
  } finally {
    await walletCtx.wallet.stop();
  }
}
