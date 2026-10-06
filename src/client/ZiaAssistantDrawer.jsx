import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Bot,
  User,
  ExternalLink,
  ReceiptText,
  Headphones,
  Plus,
  Box,
  FileText,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
import API_URL from "../config/api";

function formatMarkdown(text) {
  if (!text) return "";
  // Split into lines for structured rendering
  return text;
}

export default function ZiaAssistantDrawer({
  isOpen,
  onClose,
  client,
  onNavigate,
}) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello **${client?.contactPerson || client?.companyName || "there"}**! 👋 I am **Zia**, your live CRM Assistant.\n\nI have real-time access to your account data for **${client?.companyName || "your company"}**.\n\nYou can ask me questions about your **AMC contracts**, **open support tickets**, **pending invoices**, or **software licenses**!`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      suggestedActions: [
        { label: "Check AMC & Billing", action: "billing" },
        { label: "View Support Tickets", action: "tickets" },
        { label: "Registered Products", action: "products" },
      ],
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerInfo, setProviderInfo] = useState("CRM Live Intelligence");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check AI backend provider status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const token =
          localStorage.getItem("client-connect-token") ||
          sessionStorage.getItem("client-connect-token") ||
          "";
        const res = await fetch(`${API_URL}/api/client/ai/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.provider) {
          setProviderInfo(data.provider);
        }
      } catch {
        // use default
      }
    }
    if (isOpen) {
      checkStatus();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = String(textToSend || inputMessage).trim();
    if (!query || loading) return;

    const userMessageId = `user-${Date.now()}`;
    const newUserMsg = {
      id: userMessageId,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const token =
        localStorage.getItem("client-connect-token") ||
        sessionStorage.getItem("client-connect-token") ||
        "";

      // Prepare conversation history
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch(`${API_URL}/api/client/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: query,
          history,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to get response from Zia.");
      }

      if (result.provider) {
        setProviderInfo(
          result.provider === "gemini"
            ? "Google Gemini AI"
            : "CRM Live Intelligence"
        );
      }

      const aiMessageId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant",
          content: result.reply,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          suggestedActions: result.suggestedActions || [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${error.message || "I encountered a problem processing your request. Please try again or reach out to the support desk."}`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    if (action === "billing") {
      onNavigate?.("billing");
      onClose();
    } else if (action === "tickets" || action === "raise_ticket") {
      onNavigate?.("tickets");
      onClose();
    } else if (action === "products") {
      onNavigate?.("products");
      onClose();
    } else if (action === "documents" || action === "download_bill") {
      onNavigate?.("documents");
      onClose();
    } else if (action === "contact_desk") {
      window.location.href = "tel:+919876543210";
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "assistant",
        content: `Conversation refreshed! How can I help you with **${client?.companyName || "your account"}**?`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        suggestedActions: [
          { label: "Check AMC & Billing", action: "billing" },
          { label: "View Support Tickets", action: "tickets" },
          { label: "Registered Products", action: "products" },
        ],
      },
    ]);
  };

  const quickPrompts = [
    "What is my AMC renewal & billing status?",
    "Check my open support tickets",
    "How do I raise a critical support ticket?",
    "What software products are licensed to us?",
    "Contact support desk phone & email",
  ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close Zia AI Assistant"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col bg-white shadow-[-20px_0_60px_rgba(15,23,42,0.18)] transition-all animate-in slide-in-from-right duration-200 border-l border-slate-200/90">
        {/* Drawer Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200/90 px-4 py-3 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1B59F8] text-white shadow-xs">
              <Sparkles size={16} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold text-slate-900 tracking-tight truncate">
                  Zia AI Assistant
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-600/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Powered by {providerInfo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearHistory}
              title="Clear Conversation"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
            >
              <RotateCcw size={13} />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Assistant"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Live Context Strip */}
        <div className="shrink-0 bg-blue-50/60 border-b border-blue-100 px-4 py-2 flex items-center justify-between text-[11px] text-[#1B59F8]">
          <span className="font-semibold truncate">
            {client?.companyName || "Client Account"}
          </span>
          <span className="text-[10px] text-slate-500 shrink-0 font-medium">
            AMC:{" "}
            <span className="font-semibold text-slate-700">
              {client?.amcStatus || "Active"}
            </span>
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
          {/* Quick Prompts Carousel/Pills */}
          {messages.length <= 2 && (
            <div className="space-y-1.5 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Suggested Questions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="text-left rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:border-[#1B59F8] hover:bg-blue-50/50 hover:text-[#1B59F8] transition shadow-2xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#1B59F8] mt-0.5 shadow-2xs">
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                    isUser
                      ? "rounded-tr-xs bg-[#1B59F8] text-white"
                      : "rounded-tl-xs border border-slate-200/90 bg-white text-slate-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return (
                          <p
                            key={idx}
                            className="font-bold text-slate-900 mt-2 mb-1 text-xs"
                          >
                            {line.replace("### ", "")}
                          </p>
                        );
                      }
                      if (line.startsWith("- ")) {
                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-1.5 my-0.5 ml-1"
                          >
                            <span className="text-[#1B59F8] font-bold">•</span>
                            <span
                              dangerouslySetInnerHTML={{
                                __html: line
                                  .replace("- ", "")
                                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                  .replace(/\*(.*?)\*/g, "<em>$1</em>")
                                  .replace(
                                    /`([^`]+)`/g,
                                    '<code class="px-1 py-0.5 rounded bg-slate-100 text-blue-700 font-mono text-[10px]">$1</code>'
                                  ),
                              }}
                            />
                          </div>
                        );
                      }
                      return (
                        <p
                          key={idx}
                          className="my-1"
                          dangerouslySetInnerHTML={{
                            __html: line
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\*(.*?)\*/g, "<em>$1</em>")
                              .replace(
                                /`([^`]+)`/g,
                                '<code class="px-1 py-0.5 rounded bg-slate-100 text-blue-700 font-mono text-[10px]">$1</code>'
                              ),
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Suggested Action Buttons */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleActionClick(action.action)}
                          className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-semibold text-[#1B59F8] hover:bg-blue-100 transition shadow-2xs"
                        >
                          <span>{action.label}</span>
                          <ExternalLink size={10} />
                        </button>
                      ))}
                    </div>
                  )}

                  <div
                    className={`mt-1.5 text-[9px] ${
                      isUser ? "text-blue-200 text-right" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700 mt-0.5">
                    <User size={14} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-2.5 items-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#1B59F8] shadow-2xs">
                <Bot size={14} />
              </div>
              <div className="rounded-2xl rounded-tl-xs border border-slate-200/90 bg-white p-3 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1B59F8] animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1B59F8] animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1B59F8] animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-[11px] font-medium text-slate-400">
                    Zia is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="shrink-0 border-t border-slate-200/90 bg-white p-3 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask Zia about tickets, AMC, bills, products..."
                disabled={loading}
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/90 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#1B59F8] focus:bg-white focus:outline-hidden transition shadow-2xs disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B59F8] text-white shadow-xs hover:bg-[#1548D1] transition disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
            >
              <Send size={15} />
            </button>
          </form>

          <p className="text-[10px] text-center text-slate-400">
            Zia AI is grounded with your live account records & contracts.
          </p>
        </div>
      </aside>
    </>
  );
}

