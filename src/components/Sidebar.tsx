'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, LayoutDashboard, Mic, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Reunioes', icon: Home },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/recording', label: 'Nova Gravacao', icon: Mic },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg bg-card/80 backdrop-blur-lg border border-border/50 text-muted-foreground hover:text-foreground transition-colors lg:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 flex h-full w-56 flex-col border-r border-border/50 bg-card/50 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-border/50">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary font-bold text-sm">
            M
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-none tracking-tight">
              Meeting<span className="text-primary">Recorder</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
              AI Platform
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-2 mb-2 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/12 text-primary shadow-sm shadow-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive && 'text-primary')} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border/50 px-5 py-3">
          <p className="text-[10px] text-muted-foreground/50 tracking-wide">
            v1.0 — Carbon Blue
          </p>
        </div>
      </aside>
    </>
  );
}
