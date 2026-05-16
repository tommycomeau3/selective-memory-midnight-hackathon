import { Link, Outlet, useLocation } from 'react-router-dom';
import { Shield, Vault, Bot, MessageSquare, Sparkles } from 'lucide-react';

const nav = [
  { to: '/', label: 'Home', icon: Sparkles },
  { to: '/vault', label: 'Vault', icon: Vault },
  { to: '/agents', label: 'Agents', icon: Bot },
  { to: '/chat', label: 'Chat', icon: MessageSquare },
];

export function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen mesh-gradient">
      <nav className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Shield className="h-6 w-6 text-cyan-400" />
            <span className="gradient-text text-lg">Selective Reality</span>
          </Link>
          <div className="flex gap-1 sm:gap-2">
            {nav.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-slate-800 text-cyan-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
