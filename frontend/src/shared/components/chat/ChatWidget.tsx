import { useState } from "react";
import { MessageCircle, X, Train, LogIn } from "lucide-react";
import { ChatWindow } from "./ChatWindow";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-brand-accent text-white shadow-lg hover:bg-brand-accentHov transition-all flex items-center justify-center"
        aria-label="Open AI booking assistant"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] h-[520px] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col bg-white">
          {isAuthenticated ? (
            <ChatWindow />
          ) : (
            // ── Not logged in ──
            <div className="flex flex-col h-full">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-brand-primary text-white rounded-t-2xl">
                <span className="text-sm font-semibold">IRCTC AI Assistant</span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center bg-slate-50">
                <div className="w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center">
                  <Train className="w-7 h-7 text-brand-primary" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Please log in</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Sign in to use the AI booking assistant and book train tickets by chat.
                  </p>
                </div>
                <button
                  onClick={() => { setIsOpen(false); navigate("/login"); }}
                  className="flex items-center gap-2 bg-brand-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Log In
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
