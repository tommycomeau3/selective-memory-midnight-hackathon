import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', apiRouter);

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    openai: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.listen(PORT, () => {
  console.log(`Selective Reality API on http://localhost:${PORT}`);
  console.log(
    process.env.OPENAI_API_KEY
      ? 'OpenAI mode enabled'
      : 'Mock chat mode (no OPENAI_API_KEY)'
  );
});
