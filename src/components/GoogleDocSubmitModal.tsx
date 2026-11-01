import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Copy,
  Check,
  X,
  AlertCircle,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';
import {
  createBEMSGoogleDocument,
  googleSignIn,
  googleSignOut,
  initWorkspaceAuth,
  getAccessToken,
  GoogleDocCreationResult,
} from '../services/googleDocsService';
import { BEMS_DOCUMENT_TITLE, BEMS_DOCUMENTATION_ESSAY } from '../data/bemsDocumentationText';
import { User } from 'firebase/auth';

interface GoogleDocSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDocSubmitModal: React.FC<GoogleDocSubmitModalProps> = ({ isOpen, onClose }) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<string>('');
  const [docResult, setDocResult] = useState<GoogleDocCreationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<'preview' | 'status'>('preview');

  useEffect(() => {
    if (!isOpen) return;

    // Listen for auth state
    const unsubscribe = initWorkspaceAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasToken(!!token);
      },
      () => {
        setGoogleUser(null);
        setHasToken(false);
      }
    );

    // Also check token immediately
    getAccessToken().then(tok => {
      if (tok) setHasToken(true);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setError(null);
    setIsAuthenticating(true);
    try {
      const res = await googleSignIn();
      setGoogleUser(res.user);
      setHasToken(true);
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setError(err?.message || 'Failed to authenticate with Google.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSubmitToGoogleDocs = async () => {
    setError(null);
    setIsSubmitting(true);
    setActiveView('status');
    setSubmitProgress('Starting Google Docs generation...');

    try {
      const result = await createBEMSGoogleDocument(
        BEMS_DOCUMENT_TITLE,
        BEMS_DOCUMENTATION_ESSAY,
        status => {
          setSubmitProgress(status);
        }
      );
      setDocResult(result);
    } catch (err: any) {
      console.error('Submission failed:', err);
      setError(err?.message || 'Error occurred while creating Google Document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!docResult?.docUrl) return;
    navigator.clipboard.writeText(docResult.docUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white border border-sky-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-sky-50/80 border-b border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Submit Option A as a Google Document
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                  Google Docs API
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Generates the complete BEMS Master Architectural & Operational Chronicle directly in your Google Drive.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-sky-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation / Tabs */}
        <div className="px-6 py-2.5 bg-sky-50/40 border-b border-sky-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('preview')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                activeView === 'preview'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Document Text Preview
            </button>
            <button
              onClick={() => setActiveView('status')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
                activeView === 'status'
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/60'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Google Docs Submission State
            </button>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            {googleUser ? (
              <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Connected: {googleUser.email || googleUser.displayName}
              </span>
            ) : (
              <span className="text-slate-400 italic">Google Account Not Connected</span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-800">Submission Error</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {activeView === 'status' && (
            <div className="space-y-6">
              {/* Document Creation Box */}
              {!docResult ? (
                <div className="p-6 rounded-2xl bg-sky-50/50 border border-sky-200 text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                    <FileText className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Create Document in Google Drive
                    </h3>
                    <p className="text-sm text-slate-500 max-w-lg mx-auto mt-1">
                      Clicking submit will create a new Google Document named{' '}
                      <span className="text-teal-700 font-medium font-mono text-xs">
                        "{BEMS_DOCUMENT_TITLE}"
                      </span>{' '}
                      and populate it with the full architectural and operational chronicle.
                    </p>
                  </div>

                  {/* Auth Requirement */}
                  {!hasToken ? (
                    <div className="pt-2">
                      <p className="text-xs text-slate-500 mb-3">
                        Connect with your Google Account to grant write access to Google Docs and Google Drive files.
                      </p>
                      <button
                        onClick={handleSignIn}
                        disabled={isAuthenticating}
                        className="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white hover:bg-sky-50 text-slate-800 border border-sky-200 font-semibold text-sm transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {isAuthenticating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                        )}
                        <span>{isAuthenticating ? 'Authenticating...' : 'Sign in with Google'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 flex flex-col items-center gap-3">
                      <button
                        onClick={handleSubmitToGoogleDocs}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-sm transition-all shadow-md shadow-teal-500/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        <span>
                          {isSubmitting
                            ? submitProgress || 'Submitting to Google Docs...'
                            : 'Submit Option A as a Google Document'}
                        </span>
                      </button>

                      {isSubmitting && (
                        <div className="flex items-center gap-2 text-xs text-teal-700 font-medium animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{submitProgress}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Success Card */
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200">
                        Successfully Created
                      </span>
                      <h3 className="text-lg font-bold text-slate-800 mt-1">
                        {docResult.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        The complete BEMS Architectural and Operational Chronicle has been written to your Google Docs account and saved in Google Drive.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-sky-200 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex-1 truncate font-mono text-xs text-teal-700">
                      {docResult.docUrl}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors border border-sky-200"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>

                      <a
                        href={docResult.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                      >
                        <span>Open in Google Docs</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-emerald-100">
                    <span>Document ID: <strong className="text-slate-700 font-mono">{docResult.documentId}</strong></span>
                    <button
                      onClick={handleSubmitToGoogleDocs}
                      className="text-teal-700 font-medium hover:underline"
                    >
                      Re-generate or Create Another Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'preview' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{BEMS_DOCUMENT_TITLE}</h4>
                  <p className="text-xs text-slate-500">
                    Unabridged continuous narrative covering all 13 chapters, operational flows, formulas, and UI controls.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveView('status');
                    if (hasToken && !docResult) {
                      handleSubmitToGoogleDocs();
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-bold text-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Submit to Google Docs</span>
                </button>
              </div>

              {/* Scrollable text box */}
              <div className="p-5 rounded-xl bg-sky-50/30 border border-sky-200 font-serif text-slate-800 text-sm leading-relaxed max-h-[480px] overflow-y-auto whitespace-pre-wrap select-text">
                {BEMS_DOCUMENTATION_ESSAY}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-sky-50/80 border-t border-sky-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {docResult ? (
              <span className="text-emerald-700 font-medium">
                Document URL ready &bull; View or share anytime
              </span>
            ) : (
              <span>Requires Google Drive & Docs authorization via Google Identity</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-sky-50 text-slate-700 border border-sky-200 text-xs font-semibold transition-colors shadow-xs"
            >
              Close
            </button>
            {!docResult && (
              <button
                onClick={() => {
                  setActiveView('status');
                  if (hasToken) {
                    handleSubmitToGoogleDocs();
                  } else {
                    handleSignIn();
                  }
                }}
                disabled={isSubmitting || isAuthenticating}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{hasToken ? 'Proceed to Submit' : 'Connect & Submit'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
