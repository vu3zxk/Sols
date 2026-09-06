import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  LogOut, 
  ShieldCheck, 
  Check, 
  ExternalLink, 
  Loader2, 
  Trash2,
  Sparkles,
  Camera
} from 'lucide-react';
import { AppUser } from '../types';
import { SavedAccount } from '../lib/accounts';

interface AccountSwitcherProps {
  currentUser: AppUser;
  savedAccounts: SavedAccount[];
  onSwitchAccount: (account: SavedAccount) => Promise<void>;
  onAddAccount: () => Promise<void>;
  onSignOutCurrent: () => Promise<void>;
  onSignOutAll: () => Promise<void>;
  onRemoveSavedAccount: (uid: string) => void;
}

const AVATAR_COLORS = [
  'bg-emerald-600 text-emerald-50',
  'bg-sky-600 text-sky-50',
  'bg-indigo-600 text-indigo-50',
  'bg-amber-600 text-amber-50',
  'bg-purple-600 text-purple-50',
  'bg-rose-600 text-rose-50',
  'bg-teal-600 text-teal-50',
];

function getAvatarColorClass(str: string | null | undefined): string {
  if (!str) return 'bg-stone-700 text-stone-100';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.trim().charAt(0).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().charAt(0).toUpperCase();
  }
  return 'U';
}

export const AccountSwitcher: React.FC<AccountSwitcherProps> = ({
  currentUser,
  savedAccounts,
  onSwitchAccount,
  onAddAccount,
  onSignOutCurrent,
  onSignOutAll,
  onRemoveSavedAccount
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [switchingTargetEmail, setSwitchingTargetEmail] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectAccount = async (account: SavedAccount) => {
    if (account.uid === currentUser.uid) {
      setIsOpen(false);
      return;
    }
    try {
      setIsSwitching(true);
      setSwitchingTargetEmail(account.email);
      setErrorNotice(null);
      await onSwitchAccount(account);
      setIsOpen(false);
    } catch (err: any) {
      const isUserClosed = 
        err?.code === 'auth/popup-closed-by-user' || 
        err?.code === 'auth/cancelled-popup-request' ||
        (typeof err?.message === 'string' && (
          err.message.includes('popup-closed-by-user') || 
          err.message.includes('cancelled-popup-request')
        ));

      if (isUserClosed) {
        // User closed or dismissed the popup without signing in - standard user action
        console.info("Account switch popup was closed by user.");
      } else {
        console.error("Account switch failed:", err);
        setErrorNotice(err?.message || "Could not switch account. Please try again.");
      }
    } finally {
      setIsSwitching(false);
      setSwitchingTargetEmail(null);
    }
  };

  const handleAddNewAccount = async () => {
    try {
      setIsSwitching(true);
      setErrorNotice(null);
      await onAddAccount();
      setIsOpen(false);
    } catch (err: any) {
      const isUserClosed = 
        err?.code === 'auth/popup-closed-by-user' || 
        err?.code === 'auth/cancelled-popup-request' ||
        (typeof err?.message === 'string' && (
          err.message.includes('popup-closed-by-user') || 
          err.message.includes('cancelled-popup-request')
        ));

      if (isUserClosed) {
        // User voluntarily dismissed popup
        console.info("Add account popup was closed by user.");
      } else {
        console.error("Add account failed:", err);
        setErrorNotice(err?.message || "Could not sign in to the new account.");
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const otherAccounts = savedAccounts.filter(acc => acc.uid !== currentUser.uid);
  const userInitial = getInitials(currentUser.displayName, currentUser.email);
  const activeColorClass = getAvatarColorClass(currentUser.displayName || currentUser.email);

  return (
    <div className="relative" ref={containerRef}>
      {/* Circle DP Button (Top Right Header) */}
      <button
        id="btn-user-avatar"
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="relative group p-0.5 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-transform active:scale-95 cursor-pointer"
        title={`Google Account: ${currentUser.displayName || currentUser.email || 'User'}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {currentUser.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName || "User"}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-stone-300 group-hover:border-stone-500 object-cover shadow-2xs transition-all"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${activeColorClass} flex items-center justify-center text-sm font-semibold border-2 border-stone-300 group-hover:border-stone-500 shadow-2xs transition-all`}>
            {userInitial}
          </div>
        )}
      </button>

      {/* Google-Inspired Multi-Account Popover Menu */}
      {isOpen && (
        <div 
          id="account-switcher-popover"
          className="absolute right-0 mt-2.5 w-[360px] sm:w-[400px] max-w-[calc(100vw-24px)] bg-[#1F2023] text-stone-100 rounded-3xl shadow-2xl border border-stone-800/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)' }}
        >
          {/* Top Bar with Close 'X' and Header Info */}
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400 tracking-wide">
              {currentUser.email || "Google Account"}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 rounded-full transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Account Card (Top Hero Profile) */}
          <div className="px-5 py-4 flex flex-col items-center text-center bg-[#2B2C30]/50 mx-3 rounded-2xl border border-stone-800/60 mb-3">
            <div className="relative mb-3 group/avatar">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || "User"}
                  className="w-18 h-18 rounded-full border-2 border-amber-400/80 object-cover shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={`w-18 h-18 rounded-full ${activeColorClass} flex items-center justify-center text-2xl font-bold border-2 border-amber-400/80 shadow-md`}>
                  {userInitial}
                </div>
              )}
              {/* Subtle Camera Icon Badge (like Google avatar editor) */}
              <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#1F2023] text-amber-300 border border-stone-700 shadow-xs">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <h3 className="text-base font-semibold text-stone-100 tracking-tight">
              {currentUser.displayName || "Google User"}
            </h3>
            <p className="text-xs text-stone-400 mt-0.5 max-w-[280px] truncate">
              {currentUser.email || "No email available"}
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800/90 border border-stone-700/70 text-[11px] text-amber-300 font-medium">
              <Check className="w-3 h-3 text-amber-400" />
              <span>Current Active Session</span>
            </div>
          </div>

          {/* Error Notice if any switch operation failed */}
          {errorNotice && (
            <div className="mx-3 mb-3 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-200">
              {errorNotice}
            </div>
          )}

          {/* Other Signed-in Accounts Section */}
          {otherAccounts.length > 0 && (
            <div className="px-3 pb-2 space-y-1.5">
              <div className="px-3 py-1 text-[11px] font-medium text-stone-400 uppercase tracking-wider">
                Switch Account
              </div>

              {otherAccounts.map((account) => {
                const initial = getInitials(account.displayName, account.email);
                const colorClass = getAvatarColorClass(account.displayName || account.email);
                const isThisSwitching = isSwitching && switchingTargetEmail === account.email;

                return (
                  <div
                    key={account.uid}
                    className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-[#2B2C30] transition cursor-pointer border border-transparent hover:border-stone-800"
                    onClick={() => !isSwitching && handleSelectAccount(account)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {account.photoURL ? (
                        <img
                          src={account.photoURL}
                          alt={account.displayName || "Account"}
                          className="w-9 h-9 rounded-full border border-stone-700 object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center text-xs font-semibold shrink-0`}>
                          {initial}
                        </div>
                      )}
                      <div className="text-left min-w-0">
                        <div className="text-xs font-medium text-stone-200 truncate group-hover:text-amber-200 transition">
                          {account.displayName || account.email?.split('@')[0] || "Account"}
                        </div>
                        <div className="text-[11px] text-stone-400 truncate">
                          {account.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {isThisSwitching ? (
                        <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveSavedAccount(account.uid);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-500 hover:text-red-400 hover:bg-stone-800 rounded-lg transition"
                          title="Remove this account from list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action List: Add Account & Sign Out Options */}
          <div className="px-3 py-2 border-t border-stone-800/80 space-y-1">
            {/* Add Another Account Button */}
            <button
              id="btn-add-account"
              type="button"
              disabled={isSwitching}
              onClick={handleAddNewAccount}
              className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-[#2B2C30] text-stone-200 hover:text-white transition text-xs font-medium disabled:opacity-50 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-stone-800/90 border border-stone-700 flex items-center justify-center text-stone-300">
                {isSwitching && !switchingTargetEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </div>
              <div className="text-left">
                <span className="block font-medium">Add another account</span>
                <span className="block text-[11px] text-stone-400">Sign in with a different Google ID</span>
              </div>
            </button>

            {/* Sign Out Options */}
            <button
              id="btn-signout-current"
              type="button"
              onClick={async () => {
                setIsOpen(false);
                await onSignOutCurrent();
              }}
              className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-[#2B2C30] text-stone-300 hover:text-stone-100 transition text-xs font-medium cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-stone-800/90 border border-stone-700 flex items-center justify-center text-stone-400">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span>Sign out of this account</span>
              </div>
            </button>

            {otherAccounts.length > 0 && (
              <button
                id="btn-signout-all"
                type="button"
                onClick={async () => {
                  setIsOpen(false);
                  await onSignOutAll();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-2 rounded-xl hover:bg-red-950/40 text-stone-400 hover:text-red-300 transition text-xs font-medium cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-stone-800/90 border border-stone-700 flex items-center justify-center text-red-400">
                  <LogOut className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span>Sign out of all accounts</span>
                </div>
              </button>
            )}
          </div>

          {/* Privacy & Owner-Bound Security Footer */}
          <div className="px-5 py-3.5 bg-[#17181A] border-t border-stone-800/90 flex items-center justify-between text-[11px] text-stone-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Owner-Isolated Firestore</span>
            </div>
            <div className="flex items-center gap-2 text-stone-400">
              <span className="hover:text-stone-200 transition cursor-default">Privacy</span>
              <span>&bull;</span>
              <span className="hover:text-stone-200 transition cursor-default">Terms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
