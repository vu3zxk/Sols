import React from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  BookOpen, 
  Target, 
  Flame, 
  Compass, 
  BarChart3, 
  Settings,
  Sun
} from 'lucide-react';
import { AppUser, NavigationTab } from '../types';
import { UserProfileMenu } from './UserProfileMenu';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  user: AppUser | null;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  onLogout,
}) => {
  const navItems: { tab: NavigationTab; label: string; icon: React.ElementType }[] = [
    { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { tab: 'journal', label: 'Journal', icon: BookOpen },
    { tab: 'goals', label: 'Monthly Plans', icon: Target },
    { tab: 'habits', label: 'Habits', icon: Flame },
    { tab: 'bucket', label: 'Bucket List', icon: Compass },
    { tab: 'month-review', label: 'Review', icon: BarChart3 },
    { tab: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shrink-0 z-30 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-stone-100 dark:bg-amber-400 dark:text-stone-950 flex items-center justify-center shadow-xs">
            <Sun className="w-5 h-5 text-amber-300 dark:text-stone-950" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-stone-900 dark:text-white block leading-tight">
              Sols
            </span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium hidden sm:block">
              Daily Arc &amp; Horizons
            </span>
          </div>
        </button>

        {/* Center Nav Tabs (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-stone-100/80 dark:bg-stone-800/60 rounded-2xl border border-stone-200/60 dark:border-stone-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                type="button"
                id={`nav-tab-${item.tab}`}
                onClick={() => onSelectTab(item.tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-2xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-white/50 dark:hover:bg-stone-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Theme Toggle & Single User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gemini Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl shadow-2xs">
            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Gemini 3.6 Flash</span>
          </div>

          {/* Dark/Light Switch */}
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />

          {/* User Profile Menu (No multi-account) */}
          {user && (
            <UserProfileMenu
              user={user}
              onLogout={onLogout}
            />
          )}
        </div>
      </div>

      {/* Mobile Nav Row */}
      <nav className="flex md:hidden items-center gap-1 overflow-x-auto pt-2 pb-0.5 scrollbar-none border-t border-stone-100 dark:border-stone-800/60 mt-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => onSelectTab(item.tab)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
