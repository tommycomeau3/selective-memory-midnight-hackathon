import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { MemoryVault } from './pages/MemoryVault';
import { AgentDashboard } from './pages/AgentDashboard';
import { Chat } from './pages/Chat';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/vault" element={<MemoryVault />} />
          <Route path="/agents" element={<AgentDashboard />} />
          <Route path="/chat" element={<Chat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
