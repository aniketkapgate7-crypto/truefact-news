"use client";

import { useState } from "react";
import { liveChannels, type LiveStreamChannel } from "@/data/mockNews";

export function LiveStreamSection() {
  const [activeChannel, setActiveChannel] = useState<LiveStreamChannel>(liveChannels[0]);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-950 text-white overflow-hidden shadow-2xl">
      {/* Broadcast Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-800 px-6 py-4 bg-gray-900/80">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <h3 className="font-serif text-lg font-bold tracking-tight text-white">
            Live News Streams & Real-Time Broadcast Integration
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
            ● LIVE {activeChannel.viewerCount}
          </span>
          <span className="text-xs text-gray-400 hidden sm:inline">
            Automated Transcript Matcher Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
        {/* Stream Player Area */}
        <div className="p-4 sm:p-6 bg-black flex flex-col justify-between min-h-[360px] sm:min-h-[440px]">
          {/* Responsive Video Embed Container */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-800 shadow-inner">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeChannel.embedId}?autoplay=0&mute=1&controls=1&modestbranding=1`}
              title={activeChannel.name}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Active Broadcast Info */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-red-500">
                  {activeChannel.badge}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-xs font-semibold text-gray-300">
                  {activeChannel.channel}
                </span>
              </div>
              <h4 className="font-serif text-xl font-bold text-white">
                {activeChannel.name}
              </h4>
              <p className="text-xs text-gray-400 mt-1 max-w-xl">
                {activeChannel.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/60">
                <span>✓</span> On-Screen Red Flag Scanner Running
              </span>
            </div>
          </div>
        </div>

        {/* Channel Selector Sidebar */}
        <div className="border-t lg:border-t-0 lg:border-l border-gray-800 p-4 bg-gray-900/50 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1 mb-2">
            Select Live Broadcast Channel
          </h4>

          <div className="space-y-2">
            {liveChannels.map((channel) => {
              const isSelected = channel.id === activeChannel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannel(channel)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-red-950/40 border-red-600/60 text-white shadow-md"
                      : "bg-gray-900/60 border-gray-800 text-gray-300 hover:bg-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{channel.name}</span>
                    {isSelected && (
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white">
                        Playing
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{channel.channel}</span>
                    <span className="text-red-400 text-[11px] font-medium">{channel.viewerCount}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 p-3 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-400">
            <span className="font-bold text-white block mb-1">Live Audio Transcriber:</span>
            Real-time optical character recognition & speech parsing active across all live streams.
          </div>
        </div>
      </div>
    </div>
  );
}
