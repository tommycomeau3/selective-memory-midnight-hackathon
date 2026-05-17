import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { handleChat } from './chat.js';
import { generateAgentAccessProof } from './proof.js';
import { listAgents } from './store.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    openai: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.get('/api/health/midnight', async (_req, res) => {
  try {
    const { getMidnightStatus } = await import('./midnight/status.js');
    const status = await getMidnightStatus();
    res.status(status.ready ? 200 : 503).json(status);
  } catch (err) {
    res.status(503).json({
      ready: false,
      error: err instanceof Error ? err.message : 'Midnight status unavailable',
    });
  }
});

app.get('/api/agents', (_req, res) => {
  res.json(listAgents());
});

app.post('/api/proof/generate', async (req, res) => {
  const agentId = req.body?.agentId as string | undefined;
  if (!agentId) {
    res.status(400).json({ error: 'agentId required' });
    return;
  }
  try {
    res.json(await generateAgentAccessProof(agentId));
  } catch (err) {
    console.error(err);
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Failed to generate proof',
    });
  }
});

app.post('/api/chat', async (req, res) => {
  const agentId = req.body?.agentId as string | undefined;
  const message = req.body?.message as string | undefined;
  if (!agentId || !message) {
    res.status(400).json({ error: 'agentId and message required' });
    return;
  }
  try {
    res.json(await handleChat(agentId, message));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Selective Memory AI API → http://localhost:${PORT}`);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY?.trim());
  console.log(hasOpenAI ? 'OpenAI enabled' : 'Mock chat (no OPENAI_API_KEY)');
});
