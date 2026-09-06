import React from 'react';
import { X, ShieldCheck, Database, KeyRound, Lock, Server, FileText } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900">Security & Architecture Directives</h3>
              <p className="text-xs text-stone-500">Owner-Bound Isolation &amp; Zero Hardcoded Secrets</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-stone-700">
          {/* Threat Model Table */}
          <div>
            <h4 className="font-semibold text-stone-900 flex items-center gap-2 mb-2.5">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Agentic Threat Modeling (The 5 Threat Zones)</span>
            </h4>
            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-stone-100 text-stone-900 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">Threat Zone</th>
                    <th className="p-2.5">Risk Vector</th>
                    <th className="p-2.5">Enforced Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  <tr>
                    <td className="p-2.5 font-medium">1. Input Surfaces</td>
                    <td className="p-2.5 text-stone-600">Prompt injection, payload overflow</td>
                    <td className="p-2.5 text-emerald-800 font-medium">Delimited context framing &amp; 10k-char boundaries</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">2. Planning / AI</td>
                    <td className="p-2.5 text-stone-600">Instruction hijacking</td>
                    <td className="p-2.5 text-emerald-800 font-medium">Strict system directives and bounded prompt roles</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">3. Tool &amp; API</td>
                    <td className="p-2.5 text-stone-600">Client-side API key leak</td>
                    <td className="p-2.5 text-emerald-800 font-medium">Server-side Express proxy with 4-model fallback ladder</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">4. Memory &amp; State</td>
                    <td className="p-2.5 text-stone-600">Cross-tenant document access</td>
                    <td className="p-2.5 text-emerald-800 font-medium">Strict Firestore rules: <code className="text-[11px] bg-stone-100 px-1">request.auth.uid == userId</code></td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">5. Data Ingestion</td>
                    <td className="p-2.5 text-stone-600">Undefined crash / data loss</td>
                    <td className="p-2.5 text-emerald-800 font-medium">Zero-crash sanitizer &amp; dirty state persistence buffer</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Partition Details */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Active User Partition Path:</span>
            </div>
            <code className="block font-mono text-xs bg-white border border-stone-200 p-2.5 rounded-lg text-stone-800 break-all">
              /users/{userId || "[AUTHENTICATED_UID]"}/reflections/&#123;reflectionId&#125;
            </code>
            <p className="text-xs text-stone-500">
              All queries and real-time listeners are scoped strictly to this path. Access to any document outside your UID returns a permission-denied rejection at the database level.
            </p>
          </div>

          {/* Resilient Fallback Ladder */}
          <div>
            <h4 className="font-semibold text-stone-900 flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-blue-600" />
              <span>Gemini Resilient Fallback Ladder</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white">
                <span className="font-semibold text-stone-900">1. Primary Model:</span>
                <p className="text-stone-600 font-mono">gemini-3.6-flash</p>
              </div>
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white">
                <span className="font-semibold text-stone-900">2. High-Availability:</span>
                <p className="text-stone-600 font-mono">gemini-3.1-flash-lite</p>
              </div>
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white">
                <span className="font-semibold text-stone-900">3. Dynamic Alias:</span>
                <p className="text-stone-600 font-mono">gemini-flash-latest</p>
              </div>
              <div className="p-2.5 rounded-lg border border-stone-200 bg-white">
                <span className="font-semibold text-stone-900">4. Reasoning Fallback:</span>
                <p className="text-stone-600 font-mono">gemini-3.7-flash</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 transition"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
