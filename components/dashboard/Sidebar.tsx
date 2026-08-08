'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  GitBranch,
  TrendingUp,
  Settings,
  Headphones,
  LogOut,
  Menu,
  X,
  Zap,
  Shield,
  CreditCard,
  ScanSearch,
  FlaskConical,
  ShieldAlert,
} from 'lucide-react';
import NotificationBell from '@/components/dashboard/NotificationBell'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const { dict } = useLanguage();
  const userName = session?.user?.name ?? dict.sidebar.defaultUserName;
  const userInitial = userName.charAt(0).toUpperCase();

  const navItems = [
    {
      href: '/dashboard',
      label: dict.sidebar.nav.overview,
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/campanhas',
      label: dict.sidebar.nav.campaigns,
      icon: Megaphone,
    },
    {
      href: '/dashboard/diagnostico',
      label: dict.sidebar.nav.diagnostics,
      icon: ScanSearch,
      badge: dict.sidebar.badgeNew,
    },
    {
      href: '/dashboard/auditoria',
      label: dict.sidebar.nav.funnelAudit,
      icon: GitBranch,
    },
    {
      href: '/dashboard/precos',
      label: dict.sidebar.nav.priceMonitor,
      icon: TrendingUp,
    },
    {
      href: '/dashboard/criar-campanha',
      label: dict.sidebar.nav.newCampaign,
      icon: Megaphone,
      badge: 'NEW',
    },
    {
      href: '/dashboard/laboratorio',
      label: dict.sidebar.nav.creativeLab,
      icon: FlaskConical,
      badge: 'IA',
    },
    {
      href: '/dashboard/planos',
      label: dict.sidebar.nav.plans,
      icon: CreditCard,
    },
    {
      href: '/dashboard/configuracoes',
      label: dict.sidebar.nav.settings,
      icon: Settings,
    },
    {
      href: '/dashboard/suporte',
      label: dict.sidebar.nav.support,
      icon: Headphones,
    },
  ];

  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm leading-tight block">FunnelGuard</span>
            <span className="text-neon-cyan text-xs font-medium">AI</span>
          </div>
        </div>

        {/* IA Ativa Badge */}
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-neon-cyan block"></span>
            <span className="w-2 h-2 rounded-full bg-neon-cyan block absolute animate-ping opacity-75"></span>
          </div>
          <Zap className="w-3 h-3 text-neon-cyan" />
          <span className="text-neon-cyan text-xs font-semibold">{dict.sidebar.aiActive}</span>
          <span className="ml-auto text-neon-cyan/60 text-xs font-mono">24/7</span>
        </div>

        <LanguageSwitcher className="mt-4 w-full justify-center" />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${active
                  ? 'bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                  active ? 'text-neon-cyan' : 'group-hover:text-gray-200'
                }`}
              />
              <span className="text-sm font-medium">{item.label}</span>
              {'badge' in item && item.badge && !active && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {item.badge}
                </span>
              )}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-cyan flex-shrink-0"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Logout */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <Link href="/dashboard/perfil" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex-1 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{dict.sidebar.viewProfile}</p>
            </div>
          </Link>
          <div className="ml-2 flex-shrink-0">
            <NotificationBell />
          </div>
        </div>
        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 mb-1 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 border border-transparent"
          >
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm font-medium">{dict.sidebar.superAdmin}</span>
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 w-full group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 flex-shrink-0" />
          <span className="text-sm font-medium">{dict.sidebar.signOut}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass-card border border-gray-700 text-gray-300"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`
          lg:hidden fixed left-0 top-0 h-full w-64 z-50 bg-dark-card border-r border-gray-800 transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0 bg-dark-card border-r border-gray-800 overflow-hidden">
        <SidebarContent />
      </aside>
    </>
  );
}
