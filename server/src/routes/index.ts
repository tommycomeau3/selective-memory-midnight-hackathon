import { Router } from 'express';
import { getAgentsList, handleChat } from '../services/chatService.js';
import { generateAgentAccessProof } from '../services/proofService.js';

export const apiRouter = Router();

apiRouter.get('/agents', (_req, res) => {
  res.json(getAgentsList());
});

apiRouter.post('/proof/generate', (req, res) => {
  const { agentId } = req.body as { agentId?: string };
  if (!agentId) {
    res.status(400).json({ error: 'agentId required' });
    return;
  }
  try {
    const proof = generateAgentAccessProof(agentId);
    res.json(proof);
  } catch (err) {
    res.status(400).json({
      error: err instanceof Error ? err.message : 'Failed to generate proof',
    });
  }
});

apiRouter.post('/chat', async (req, res) => {
  const { agentId, message } = req.body as {
    agentId?: string;
    message?: string;
  };
  if (!agentId || !message) {
    res.status(400).json({ error: 'agentId and message required' });
    return;
  }
  try {
    const result = await handleChat(agentId, message);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
});
