import React, { useState, useRef, useEffect } from 'react';
import { AppUser } from '../types';
import { LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

interface UserProfileMenuProps {
  user: AppUser;
  onLogout: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const initials = (user.displayName || user.email || 'U')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id="user-profile-menu-button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 pl-2 pr-1.5 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-stone-300 dark:hover:border-stone-600 transition-all focus:outline-none shadow-2xs"
        aria-label="User profile menu"
      >
        <span className="text-xs font-medium text-stone-700 dark:text-stone-300 max-w-[120px] truncate hidden md:inline">
          {user.displayName || user.email?.split('@')[0]}
        </span>
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Profile'}
            className="w-7 h-7 rounded-full object-cover border border-stone-200 dark:border-stone-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center text-xs font-semibold">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div 
          id="user-profile-dropdown"
          className="absolute right-0 mt-2 w-72 bg-white dark:bg-stone-800 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* User Profile Card */}
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100 dark:border-stone-700/60">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Profile'}
                className="w-11 h-11 rounded-full object-cover border border-stone-200 dark:border-stone-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                {user.displayName || 'Sols Explorer'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {user.email || 'Google Account'}
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>Isolated Zero-Trust Vault</span>
              </div>
            </div>
          </div>

          {/* Sign out action */}
          <div className="pt-3">
            <button
              type="button"
              id="user-signout-button"
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-stone-700 dark:text-stone-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
