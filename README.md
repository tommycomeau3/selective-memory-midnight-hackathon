# Selective Memory AI

**Give each AI agent only the memories it needs.**

Single-page hackathon demo for selective memory sharing with mock Midnight proofs.

## Quick start

```bash
npm install
cp .env.example .env   # optional: OPENAI_API_KEY
npm run dev
```

Open http://localhost:5173

## 2-minute demo

1. Click an agent (**Health**, **Career**, **Finance**, or **Personal**)
2. Review **Allowed** vs **Blocked** memories
3. Click **Generate Midnight Access Proof**
4. Ask: **"What do you know about me?"**
5. Switch agents and repeat — each gives a **different scoped answer**

## Stack

- React + Vite + Tailwind (single page)
- Express API (in-memory store)
- Mock Midnight proofs (`POST /api/proof/generate`)
- Optional OpenAI chat (`OPENAI_API_KEY` in project root `.env`)

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/agents` | List agents |
| POST | `/api/proof/generate` | Approve scope + return proof |
| POST | `/api/chat` | Scoped chat (requires proof) |
