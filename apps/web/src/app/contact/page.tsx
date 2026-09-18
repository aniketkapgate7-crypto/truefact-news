"use client";

import { useState } from "react";
import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [department, setDepartment] = useState("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 space-y-10">
        {/* Header */}
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-800 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
            Newsroom Communication
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Contact TrueFact News
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Reach our newsroom desk, submit a claim for investigative review, or send feedback regarding our credibility scoring engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Contact Directory */}
          <div className="md:col-span-5 space-y-6 text-xs text-gray-600 dark:text-gray-400">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-5 space-y-2">
              <h3 className="font-serif font-bold text-sm text-gray-900 dark:text-white">
                Editorial Newsroom Desk
              </h3>
              <p>For story tips, breaking news corroboration, and investigative inquiries:</p>
              <p className="font-mono text-gray-900 dark:text-white font-semibold">desk@truefactnews.com</p>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-5 space-y-2">
              <h3 className="font-serif font-bold text-sm text-gray-900 dark:text-white">
                Corrections &amp; Verification Desk
              </h3>
              <p>For factual correction requests, evidence submissions, and dispute notices:</p>
              <p className="font-mono text-gray-900 dark:text-white font-semibold">corrections@truefactnews.com</p>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-[#F6F7F9] dark:bg-[#0E131F] p-5 space-y-2">
              <h3 className="font-serif font-bold text-sm text-gray-900 dark:text-white">
                API &amp; Research Licensing
              </h3>
              <p>For academic researchers, news organizations, and institutional API access:</p>
              <p className="font-mono text-gray-900 dark:text-white font-semibold">api@truefactnews.com</p>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-7">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0E131F] p-6 sm:p-8 shadow-sm">
              {submitted ? (
                <div className="p-8 text-center space-y-3">
                  <span className="text-4xl">✉️</span>
                  <h3 className="font-serif text-xl font-bold text-gray-900 dark:text-white">
                    Message Received
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Thank you for reaching out. Our editorial desk reviews all incoming tips and correction notices promptly.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 text-xs font-bold text-[#E5242A] hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="dept" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Department
                    </label>
                    <select
                      id="dept"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-[#F6F7F9] dark:bg-gray-900 p-2.5 text-xs text-gray-900 dark:text-white"
                    >
                      <option value="general">General Newsroom Inquiry</option>
                      <option value="claim">Submit Claim for Fact-Checking</option>
                      <option value="correction">Request an Article Correction</option>
                      <option value="press">Press &amp; Media Inquiries</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Your Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-[#F6F7F9] dark:bg-gray-900 p-2.5 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E5242A]"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="jane@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-[#F6F7F9] dark:bg-gray-900 p-2.5 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E5242A]"
                    />
                  </div>

                  <div>
                    <label htmlFor="msg" className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                      Message &amp; Evidence Details
                    </label>
                    <textarea
                      id="msg"
                      rows={4}
                      required
                      placeholder="Provide detailed information, article URLs, or supporting document references..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-[#F6F7F9] dark:bg-gray-900 p-2.5 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E5242A]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#E5242A] py-3 text-xs font-bold text-white shadow hover:bg-[#c9181e] transition-colors"
                  >
                    Send Message to Desk
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <EditorialFooter />
    </div>
  );
}
