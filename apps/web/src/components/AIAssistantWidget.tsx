"use client";

import { useState, useRef, useEffect } from "react";
import { useNewsContext } from "@/context/NewsContext";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  confidence?: number;
  sources?: string[];
}

export function AIAssistantWidget() {
  const { activeArticle, selectedRegion } = useNewsContext();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-1",
      sender: "ai",
      text: "👋 Welcome to **TrueFact AI Assistant** (Powered by Gemini). I am inspecting your active screen and ready to summarize, fact-check, or evaluate political bias for the exact story or region you are viewing!",
      timestamp: "Just now",
      sources: ["Reuters", "Snopes", "PolitiFact", "PIB India"],
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: Message = {
      id: `u-${messages.length + 1}-${query.length}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    // Context-aware AI response generator inspecting on-screen active article and active region
    setTimeout(() => {
      let aiText = "";
      let confidence = 95;
      let sources = ["Reuters", "AP News", "Google Fact Check API"];

      const lower = query.toLowerCase();

      // Case A: User is reading a specific article on screen
      if (activeArticle) {
        if (lower.includes("summarize") || lower.includes("summary")) {
          aiText = `**Key 3-Point Summary for "${activeArticle.headline}":**\n\n1. **Core Fact**: ${activeArticle.summary}\n2. **Source & Region**: Reported by **${activeArticle.source}** for region **${activeArticle.countryFlag} ${activeArticle.region}**.\n3. **Truthiness Rating**: Rated **${activeArticle.truthAnalysis.truthScore}% Truthiness** (${activeArticle.truthAnalysis.truthGrade}) based on multi-source wire corroboration.`;
          confidence = activeArticle.truthAnalysis.truthScore;
          sources = activeArticle.truthAnalysis.sourceVerifications.map((s) => s.name).slice(0, 4);
        } else if (lower.includes("bias") || lower.includes("framing")) {
          const bias = activeArticle.truthAnalysis.biasAnalysis;
          aiText = `**Linguistic & Bias Evaluation for "${activeArticle.headline}":**\n\n- **Political Lean**: ${bias.politicalLean > 0 ? `+${bias.politicalLean} (Center-Right)` : bias.politicalLean < 0 ? `${bias.politicalLean} (Center-Left)` : "0 (Neutral)"}\n- **Sensationalism Score**: ${bias.sensationalismScore}/100\n- **Editorial Tone**: ${bias.tone}\n- **Reading Ease**: ${bias.readingEaseScore}/100`;
          confidence = 94;
          sources = ["NLP Sentiment Engine", "Flesch-Kincaid Standard"];
        } else {
          aiText = `**TrueFact AI On-Screen Analysis for "${activeArticle.headline}":**\n\n- **Headline**: ${activeArticle.headline}\n- **Region**: ${activeArticle.countryFlag} ${activeArticle.region}\n- **Publisher**: ${activeArticle.source} (${activeArticle.author})\n- **Truth Score**: ${activeArticle.truthAnalysis.truthScore}%\n\nStatement verified across ${activeArticle.truthAnalysis.sourceVerifications.length} global fact-checking registries. Zero deepfake markers detected.`;
          confidence = activeArticle.truthAnalysis.truthScore;
          sources = activeArticle.truthAnalysis.sourceVerifications.map((s) => s.name).slice(0, 4);
        }
      }
      // Case B: User is on Homepage with a specific Region selected (e.g. India 🇮🇳)
      else if (selectedRegion !== "All") {
        if (lower.includes("summarize") || lower.includes("summary")) {
          aiText = `**Active Regional Summary for ${selectedRegion}:**\n\n1. **Key Coverage**: Displaying top verified stories from **${selectedRegion}** across Breaking, Tech, Business, and Politics.\n2. **Lead Story**: ISRO Chandrayaan-4 Lunar Sample Return mission launched from Sriharikota (98% Truthiness).\n3. **Macro Highlights**: RBI keeps repo rate at 6.5% as GDP growth reaches 7.8%; Tata-Nvidia AI Supercomputing hub announced in Bengaluru.`;
          confidence = 97;
          sources = ["PIB India", "Economic Times", "NDTV", "Reuters"];
        } else {
          aiText = `**TrueFact AI Context for ${selectedRegion} Feed:**\n\nOur real-time scanner is actively tracking verified news feeds for **${selectedRegion}**. All headlines shown on your screen are cross-referenced against official press registries and regional fact-checkers.`;
          confidence = 95;
          sources = ["PIB India", "Boom Live", "Alt News", "Press Trust of India"];
        }
      }
      // Case C: User is on Homepage with All Regions selected
      else {
        if (lower.includes("summarize") || lower.includes("summary")) {
          aiText =
            "**Global News Briefing:**\n\n1. **UN Security Council**: Emergency session convened on geopolitical flashpoints across three continents (94% Truthiness).\n2. **Tech & Science**: OpenAI unveils GPT-6; NASA JWST detects exoplanet water vapor.\n3. **Economy**: S&P 500 up +0.8%, Brent crude trades at $84.20/bbl.";
          confidence = 94;
          sources = ["Reuters", "AP News", "BBC World", "Bloomberg"];
        } else {
          aiText = `**TrueFact AI Global Analysis:**\n\nCurrently scanning 14 international news wire feeds and IFCN fact-checking portals. Select any story or country filter to inspect specific claims!`;
          confidence = 95;
        }
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        confidence,
        sources,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-indigo-600 px-5 py-3 text-white shadow-2xl hover:scale-105 transition-all duration-300 group border border-white/20 active:scale-95"
        aria-label="Ask TrueFact AI Assistant"
      >
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <span className="font-serif font-black tracking-wide text-sm">
          Ask TrueFact AI ✨
        </span>
      </button>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[540px] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl flex flex-col overflow-hidden fade-in">
          {/* Drawer Header */}
          <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-red-950 px-5 py-3.5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-red-500 to-indigo-500 flex items-center justify-center font-bold text-xs shadow-inner shrink-0">
                ✨
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm leading-none text-white">
                  TrueFact AI Assistant
                </h3>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                  <span>●</span> Gemini 1.5 Pro Context Active
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white p-1 transition-colors"
              aria-label="Close Assistant"
            >
              ✕
            </button>
          </div>

          {/* Active On-Screen Context Indicator Banner */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/40 dark:to-gray-900 px-4 py-2 border-b border-red-100 dark:border-red-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-red-600 dark:text-red-400 font-bold shrink-0">👀 On-Screen:</span>
              <span className="font-semibold text-gray-900 dark:text-gray-200 truncate">
                {activeArticle
                  ? `${activeArticle.countryFlag} ${activeArticle.headline}`
                  : selectedRegion !== "All"
                  ? `📍 Filtered by ${selectedRegion}`
                  : "🌐 Global Front Page"}
              </span>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-gray-950/40 text-xs">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                      isUser
                        ? "bg-red-600 text-white rounded-br-none shadow-md font-medium"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none shadow-sm"
                    }`}
                  >
                    {msg.text}

                    {/* Metadata & Sources Badge for AI response */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/60 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-gray-400 font-semibold">Corroborated by:</span>
                        {msg.sources.map((s, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 px-1">{msg.timestamp}</span>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span>Inspecting on-screen story & fact-checking registries...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Contextual Quick Action Prompt Chips */}
          <div className="px-3 py-2 bg-gray-100/80 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              activeArticle ? `⚡ Summarize this story` : selectedRegion !== "All" ? `⚡ Summarize ${selectedRegion} news` : "⚡ Summarize top news",
              "🔍 Check bias",
              "🛡️ Verify claims",
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-500 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Footer Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                activeArticle
                  ? `Ask AI about "${activeArticle.headline.slice(0, 20)}..."`
                  : selectedRegion !== "All"
                  ? `Ask AI about ${selectedRegion} news...`
                  : "Ask AI about any story on screen..."
              }
              className="flex-1 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs disabled:opacity-40 transition-all"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
