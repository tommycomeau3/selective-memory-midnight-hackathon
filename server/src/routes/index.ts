import { Router } from 'express';
import {
  approveMemories,
  denyMemories,
  getAccessLog,
  requestMemories,
  revokeMemories,
  toPublicMemory,
} from '../services/permissionService.js';
import { getRecentProofs } from '../services/proofService.js';
import { handleChat, getAgentsList } from '../services/chatService.js';
import { store } from '../store.js';

export const apiRouter = Router();

apiRouter.get('/agents', (_req, res) => {
  res.json(getAgentsList());
});

apiRouter.get('/memories', (req, res) => {
  const agentId = req.query.agentId as string | undefined;
  const publicMemories = store.memories.map((m) =>
    toPublicMemory(m, agentId)
  );
  res.json(publicMemories);
});

apiRouter.get('/permissions/:agentId', (req, res) => {
  const grants = store.getGrantsForAgent(req.params.agentId);
  res.json(grants);
});

apiRouter.post('/permissions/request', (req, res) => {
  const { agentId, message } = req.body as {
    agentId?: string;
    message?: string;
  };
  if (!agentId || !message) {
    res.status(400).json({ error: 'agentId and message required' });
    return;
  }
  const result = requestMemories(agentId, message);
  res.json(result);
});

apiRouter.post('/permissions/approve', (req, res) => {
  const { agentId, memoryIds, duration } = req.body as {
    agentId?: string;
    memoryIds?: string[];
    duration?: 'session' | '1h';
  };
  if (!agentId || !memoryIds?.length) {
    res.status(400).json({ error: 'agentId and memoryIds required' });
    return;
  }
  const result = approveMemories(agentId, memoryIds, duration ?? 'session');
  res.json(result);
});

apiRouter.post('/permissions/deny', (req, res) => {
  const { agentId, memoryIds } = req.body as {
    agentId?: string;
    memoryIds?: string[];
  };
  if (!agentId || !memoryIds?.length) {
    res.status(400).json({ error: 'agentId and memoryIds required' });
    return;
  }
  denyMemories(agentId, memoryIds);
  res.json({ ok: true });
});

apiRouter.post('/permissions/revoke', (req, res) => {
  const { agentId, memoryIds } = req.body as {
    agentId?: string;
    memoryIds?: string[];
  };
  if (!agentId) {
    res.status(400).json({ error: 'agentId required' });
    return;
  }
  revokeMemories(agentId, memoryIds);
  res.json({ ok: true });
});

apiRouter.post('/chat', async (req, res) => {
  const { agentId, message, history } = req.body as {
    agentId?: string;
    message?: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
  };
  if (!agentId || !message) {
    res.status(400).json({ error: 'agentId and message required' });
    return;
  }
  try {
    const result = await handleChat(agentId, message, history ?? []);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

apiRouter.get('/proofs', (_req, res) => {
  res.json(getRecentProofs());
});

apiRouter.get('/access-log', (_req, res) => {
  res.json(getAccessLog());
});
