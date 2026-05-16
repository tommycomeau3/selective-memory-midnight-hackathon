import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Lock, Eye, Sparkles } from 'lucide-react';

export function Landing() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm text-cyan-300">
        <Sparkles className="h-4 w-4" />
        Midnight Hackathon · Selective Disclosure
      </div>

      <h1 className="mb-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
        <span className="gradient-text">Selective Reality</span>
      </h1>

      <p className="mb-4 max-w-2xl text-2xl font-medium text-slate-200 sm:text-3xl">
        AI should not know every version of you.
      </p>

      <p className="mb-12 max-w-xl text-lg text-slate-400">
        One private memory vault. Four specialized agents. You choose what each
        AI can see — verified by selective disclosure proofs.
      </p>

      <Link to="/vault" className="btn-primary mb-16 text-lg">
        Enter Memory Vault
        <ArrowRight className="h-5 w-5" />
      </Link>

      <div className="grid w-full max-w-4xl gap-6 sm:grid-cols-3">
        {[
          {
            icon: Lock,
            title: 'Private Vault',
            desc: 'Health, career, finance, dating, and journal — all in one place, hidden by default.',
          },
          {
            icon: Eye,
            title: 'Role-Based Access',
            desc: 'Each agent only sees categories you approve. No full profile leakage.',
          },
          {
            icon: Shield,
            title: 'Midnight Proofs',
            desc: 'Mock selective disclosure proofs verify every access grant.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="glass-card p-6 text-left transition-all duration-200 hover:border-cyan-500/20"
          >
            <Icon className="mb-3 h-8 w-8 text-cyan-400" />
            <h3 className="mb-2 font-semibold">{title}</h3>
            <p className="text-sm text-slate-400">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
