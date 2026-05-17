## Inspiration

AI assistants are getting more personal — they remember your job, health, finances, and relationships. But most systems treat memory as all-or-nothing: one agent sees everything, or you copy-paste context by hand.

We wanted **selective disclosure for AI memory**: give each specialized agent only the slice of your life it needs. A health coach shouldn't see salary negotiations; a finance bot shouldn't see therapy notes. **Midnight** felt like the right fit because it lets you prove *what* you shared (category + commitment) without exposing the full memory store on-chain.

## What it does

**Selective Memory AI** is a hackathon demo where you pick one of four agents — **Health**, **Career**, **Finance**, or **Personal** — each with explicit **allowed** and **blocked** memory categories.

1. Choose an agent and review which memory scopes it can access.
2. Click **Generate Midnight Access Proof** to approve only memories in that agent's categories.
3. Chat with the agent (e.g. *"What do you know about me?"*).
4. Switch agents and repeat — each agent answers **differently** because it only sees its approved memories.

The UI makes the policy visible before chat starts. Chat is **proof-gated**: without a valid grant, the agent refuses to answer. When Midnight is enabled, grants are recorded on-chain via the `grantAgentAccess` circuit; otherwise the demo uses a deterministic mock proof so judges can try it locally in under two minutes.

## How we built it

**Stack:** React + Vite frontend, Express API, in-memory store for demo memories/grants, optional OpenAI for chat.

**Architecture:**

- **Frontend** (`client/src/App.tsx`) — single-page flow: agent picker → scope tags → proof button → chat.
- **Backend** — three routes: list agents, generate proof, chat (proof required).
- **Memory model** — 12 demo memories across four categories (`server/src/seed.ts`), each agent scoped to one category.
- **Proof flow** (`server/src/proof.ts`) — filters memories by agent category, approves grants in the store, returns proof metadata (`proofHash`, `grantRoot`, optional `txId` for real Midnight mode).
- **Chat** (`server/src/chat.ts`) — only reads granted memories; denies blocked topics; supports mock replies or OpenAI with a system prompt restricted to approved memories.
- **Midnight integration:**
  - **Compact contract** (`contracts/memory-access.compact`) — `grantAgentAccess` records `agentId`, `categoryMask`, `grantRoot`, and `timestamp` on the ledger.
  - **Commitments** — `grantRoot` hashes approved memory IDs + timestamp off-chain; chat re-verifies before responding.
  - **Phased setup** — Docker proof server, `compact` compile to `contracts/managed/`, optional preprod deploy with `MIDNIGHT_ENABLED=true`.

**Demo path:** `npm install` → `npm run dev` → open localhost:5173 → pick agent → generate proof → ask *"What do you know about me?"*

## Challenges we ran into

- **Making privacy tangible in a 2-minute demo** — We had to show *different* answers per agent without a long onboarding flow, so we invested in clear allowed/blocked tags and a single killer question.
- **Midnight toolchain complexity** — Node 22+, Docker proof server, Compact compiler, wallet funding, and 30–90s on-chain proof generation meant we needed a **mock mode** (SHA-256) that still mirrors the real grant shape, with Midnight as the "full" path.
- **Keeping chat honest to scope** — Even with grants, models can hallucinate cross-category facts; we added server-side scope checks, blocked-topic denials, and system prompts that only include approved memories.
- **Grant verification vs. UX** — Real ZK grants are slow; we grant memories server-side first so chat still works if metadata steps fail, while Midnight mode re-checks `grantRoot` before replies.

## Accomplishments that we're proud of

- End-to-end story: **policy → proof → scoped chat** in one screen.
- A **Compact contract** (`grantAgentAccess`) that records selective-disclosure grants on Midnight, not just app-level flags.
- Four agents with **12 realistic memories** that make cross-leakage obvious when you switch agents.
- Works **offline-friendly** (mock proofs + deterministic chat) and **Midnight-ready** when env is configured.
- Clean separation: categories as bit masks, `grantRoot` commitments, and verify-before-chat for real proofs.

## What we learned

- **Privacy UX is product design** — Users need to *see* allowed vs. blocked scopes before they trust "private" AI.
- **ZK fits selective disclosure** — You don't need to put memories on-chain; a commitment + category mask is enough to audit *what* was shared.
- **Hackathon demos need a fast path** — Mock mode isn't a shortcut; it's how you teach the idea while Midnight handles the trust anchor.
- **Agent memory should be policy-first** — Scope should be enforced before the LLM sees any context, not only in the prompt.

## What's next for Selective Memory AI

- **Stronger witnesses** — Prove each memory belongs to `categoryMask` inside the circuit, not only off-chain filtering.
- **User-owned memory vault** — Persist grants across sessions; revoke or time-box access per agent.
- **More agents & finer scopes** — Sub-categories (e.g. "medications only"), shared agents with least-privilege defaults.
- **Wallet-native UX** — One-click approve from Lace; show tx/explorer links in the proof panel.
- **Production retrieval** — Embeddings + RAG still bounded by the same grant verification step before any context hits the model.
