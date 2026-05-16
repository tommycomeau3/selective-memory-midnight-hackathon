# Selective Memory AI

Give each AI agent only the memories it needs.

Single-page hackathon demo: pick an agent, generate a mock **Midnight selective disclosure proof**, then chat with scoped memory access.

## Quick start

```bash
npm install
cp .env.example .env   # optional: OPENAI_API_KEY
npm run dev
```

Open http://localhost:5173

## Demo (2 minutes)

1. Click **Health**, **Career**, **Finance**, or **Personal**
2. Review allowed vs blocked memory scopes
3. Click **Generate Midnight Access Proof**
4. Ask: *"What do you know about me?"*
5. Switch agents and repeat — each agent gives a **different** answer

## Project layout

```
midnight-hackathon/
├── client/src/
│   ├── App.tsx      # entire UI (single page)
│   ├── api.ts       # fetch helpers
│   └── types.ts     # shared frontend types
└── server/src/
    ├── index.ts     # Express app + 3 API routes
    ├── seed.ts      # agents + demo memories
    ├── store.ts     # in-memory grants & proofs
    ├── proof.ts     # mock Midnight proof generation
    └── chat.ts      # scoped chat (OpenAI or mock)
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agents` | List agents |
| POST | `/api/proof/generate` | Approve scoped memories + return proof |
| POST | `/api/chat` | Chat (requires proof for that agent) |

## How it works

1. **Proof** (`proof.ts`) — approves memories in the agent's allowed categories and returns a `proofHash` (SHA-256 today; replace with Midnight Compact).
2. **Store** (`store.ts`) — keeps grants and proofs in memory until the server restarts.
3. **Chat** (`chat.ts`) — only reads memories that were granted for the selected agent.

## Optional OpenAI

Add `OPENAI_API_KEY` to `.env` at the project root. Without it, chat uses deterministic mock replies.

## Midnight integration

Search for `MIDNIGHT_INTEGRATION` in `server/src/proof.ts` and `server/src/chat.ts`.
