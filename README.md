# Selective Reality

**AI should not know every version of you.**

A hackathon MVP demonstrating selective memory sharing for AI agents. One private memory vault — each agent only accesses memories you explicitly approve for their role.

## Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router
- **Backend:** Node.js, Express, in-memory store
- **AI:** OpenAI-compatible API (optional — works fully without an API key via mock responses)
- **Proofs:** Mock Midnight selective disclosure proofs (see integration comments in `server/src/services/proofService.ts`)

## Quick start

```bash
# From project root
npm install
cp .env.example .env   # optional: add OPENAI_API_KEY (loaded from project root)
npm run dev
```

- **App:** http://localhost:5173  
- **API:** http://localhost:3001  

## Demo script (~2 minutes)

1. **Landing** — Read the tagline. Click **Enter Memory Vault**.
2. **Memory Vault** — Show cards across Health, Career, Finance, Dating, Personal Journal. Point out hidden previews, sensitivity levels, and **Private** badges.
3. **Agent Dashboard** — Show four agents and their **Allowed** vs **Blocked** categories. Each agent is intentionally isolated.
4. **Chat → Career Agent**
   - Click **Try: "Tell me what you know about me."**
   - Send the message.
   - **Permission modal** appears listing career memories only.
   - Click **Approve**.
   - See: *"Access verified via Midnight selective disclosure proof."*
   - Career Agent responds with **career memories only** (role, promotion, etc.).
5. **Switch to Health Agent** — Same question → health memories requested → approve → **different answer** (therapy, fitness, etc.).
6. **Revocation demo**
   - With Career Agent, open modal again (or send the demo question) and click **Revoke**.
   - Ask again: *"Tell me what you know about me."*
   - Response: **"I no longer have authorization to access that memory."**
7. **Sidebar** — Show **Midnight Proofs** (expand JSON) and **Access Log** for the audit trail.

## Environment variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Optional. If unset, deterministic mock chat is used. |
| `OPENAI_BASE_URL` | Default: `https://api.openai.com/v1` |
| `OPENAI_MODEL` | Default: `gpt-4o-mini` |
| `PORT` | API port (default: `3001`) |

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/memories` | List memories (optional `?agentId=`) |
| GET | `/api/agents` | List agents |
| POST | `/api/permissions/request` | Memories an agent wants to access |
| POST | `/api/permissions/approve` | Approve access (+ generate proofs) |
| POST | `/api/permissions/deny` | Deny access |
| POST | `/api/permissions/revoke` | Revoke access |
| POST | `/api/chat` | Send message to agent |
| GET | `/api/proofs` | Recent Midnight proofs |
| GET | `/api/access-log` | Audit log |

## Midnight integration path

Mock proofs are generated in `server/src/services/proofService.ts`. In production:

1. Replace `generateProof()` with a **Midnight Compact** contract call for selective disclosure.
2. Replace `verifyProof()` with on-chain verification before LLM context is built (`chatService.ts`).
3. Store proof witnesses in the access log for auditability.

Look for `MIDNIGHT_INTEGRATION` comments in the server codebase.

## Project structure

```
├── client/          # React frontend
├── server/          # Express API
├── package.json     # npm workspaces
└── .env.example
```

## License

MIT — hackathon demo.
