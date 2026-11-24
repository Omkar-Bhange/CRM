import React, { useState, useEffect } from "react";
import {
  Search,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Tag,
  ChevronRight,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import API_URL from "../config/api";

const CATEGORIES = [
  "All",
  "Getting Started",
  "AMC & Invoicing",
  "Software Licenses",
  "Support & SLAs",
  "Security & Access",
];

export default function ClientKnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [votedMap, setVotedMap] = useState({});

  const fetchArticles = async (query = "", category = "All") => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (query.trim()) params.append("q", query.trim());
      if (category && category !== "All") params.append("category", category);

      const url = query.trim()
        ? `${API_URL}/api/kb/search?${params.toString()}`
        : `${API_URL}/api/kb?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load help articles.");
      }

      setArticles(data.data || []);
    } catch (err) {
      console.error("Fetch KB error:", err);
      setError(err.message || "Unable to load articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArticles(searchTerm, selectedCategory);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  const handleSelectArticle = async (article) => {
    setSelectedArticle(article);
    // Fetch individual article to increment view counter atomically
    try {
      const res = await fetch(`${API_URL}/api/kb/${article.slug || article._id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedArticle(data.data);
      }
    } catch (e) {
      // Non-blocking
    }
  };

  const handleVote = async (articleId, isHelpful) => {
    if (votedMap[articleId]) return;

    try {
      const res = await fetch(`${API_URL}/api/kb/${articleId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isHelpful }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVotedMap((prev) => ({ ...prev, [articleId]: isHelpful ? "up" : "down" }));
        setSelectedArticle((prev) =>
          prev && prev._id === articleId
            ? {
                ...prev,
                helpfulCount: isHelpful ? (prev.helpfulCount || 0) + 1 : prev.helpfulCount,
                notHelpfulCount: !isHelpful ? (prev.notHelpfulCount || 0) + 1 : prev.notHelpfulCount,
              }
            : prev
        );
      }
    } catch (e) {
      console.error("Vote error:", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm mb-3">
            <Sparkles size={14} className="text-amber-300" />
            <span>Self-Service Help Center & Knowledge Base</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            How can we help your team today?
          </h1>
          <p className="mt-2 text-sm text-blue-100">
            Search answers to billing inquiries, AMC renewals, SLA policies, and software operations.
          </p>

          {/* Quick Search Input */}
          <div className="relative mt-6">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search guides, tutorials, AMC terms, error codes..."
              className="w-full rounded-xl bg-white pl-12 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-md focus:outline-none focus:ring-4 focus:ring-blue-400/30"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setSelectedCategory(cat);
              setSelectedArticle(null);
            }}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition shrink-0 ${
              selectedCategory === cat
                ? "bg-[#1B59F8] text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content View: Article Detail vs Grid */}
      {selectedArticle ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <button
            type="button"
            onClick={() => setSelectedArticle(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} /> Back to all articles
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
              <span className="rounded-md bg-blue-50 px-2.5 py-0.5 border border-blue-100">
                {selectedArticle.category}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400 font-normal">
                <Eye size={13} /> {selectedArticle.viewCount || 0} views
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {selectedArticle.title}
            </h2>
          </div>

          <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-wrap border-t border-b border-slate-100 py-6">
            {selectedArticle.content}
          </div>

          {/* Tags */}
          {selectedArticle.tags && selectedArticle.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag size={14} className="text-slate-400" />
              {selectedArticle.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Feedback Section */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-800">Was this article helpful?</p>
              <p className="text-[11px] text-slate-500">
                Your feedback helps us continuously improve our client documentation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={Boolean(votedMap[selectedArticle._id])}
                onClick={() => handleVote(selectedArticle._id, true)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  votedMap[selectedArticle._id] === "up"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700 font-bold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                }`}
              >
                <ThumbsUp size={14} />
                <span>Yes ({selectedArticle.helpfulCount || 0})</span>
              </button>

              <button
                type="button"
                disabled={Boolean(votedMap[selectedArticle._id])}
                onClick={() => handleVote(selectedArticle._id, false)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  votedMap[selectedArticle._id] === "down"
                    ? "border-rose-300 bg-rose-50 text-rose-700 font-bold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                }`}
              >
                <ThumbsDown size={14} />
                <span>No ({selectedArticle.notHelpfulCount || 0})</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Article Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 rounded-2xl border border-slate-200 bg-white p-5 animate-pulse space-y-3"
              >
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-6 w-3/4 bg-slate-200 rounded" />
                <div className="h-12 w-full bg-slate-100 rounded" />
              </div>
            ))
          ) : articles.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <BookOpen size={36} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No articles found</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any documentation matching "{searchTerm}". Try a different search
                keyword or select "All" categories.
              </p>
            </div>
          ) : (
            articles.map((art) => (
              <div
                key={art._id}
                onClick={() => handleSelectArticle(art)}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition cursor-pointer"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                      {art.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Eye size={12} /> {art.viewCount || 0}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2">
                    {art.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-3">
                    {art.content}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                  <span>Read Article</span>
                  <ChevronRight size={15} className="group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
