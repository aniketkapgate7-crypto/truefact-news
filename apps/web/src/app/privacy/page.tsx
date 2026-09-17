import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata = {
  title: "Privacy Policy — TrueFact News",
  description: "Read the TrueFact News privacy policy, data protection standards, and user privacy commitments.",
};

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 space-y-8">
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-800 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
            Legal &amp; Data Protection
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500">Last updated: August 2026</p>
        </div>

        <section className="space-y-6 editorial-prose text-xs sm:text-sm">
          <h2>1. Information We Collect</h2>
          <p>
            TrueFact News values reader privacy. We collect minimal information necessary to deliver verified news:
          </p>
          <ul>
            <li><strong>Usage Data:</strong> Basic telemetry such as page views, region selection, and search queries to optimize article delivery.</li>
            <li><strong>Submitted Claims:</strong> When you submit a claim or link via our Verify a Claim interface, we store the query text to perform verification searches and enqueue investigation requests.</li>
            <li><strong>Local Preferences:</strong> Theme settings (light/dark mode) are stored locally on your device via browser local storage. Saved stories and watchlists are securely persisted to your authenticated user account.</li>
          </ul>

          <h2>2. How We Use Information</h2>
          <p>
            Information collected is used strictly to improve news corroboration, respond to user inquiries, protect our infrastructure against automated abuse, and maintain factual archives. We do not sell or rent personal data to third-party data brokers.
          </p>

          <h2>3. Cookies &amp; Local Storage</h2>
          <p>
            We use essential cookies and local storage items strictly for site functionality (e.g. remembering your theme preference). We do not deploy intrusive cross-site tracking cookies.
          </p>

          <h2>4. Security &amp; Retention</h2>
          <p>
            We implement industry-standard encryption protocols (TLS/HTTPS) for all data in transit and restrict access to internal systems.
          </p>

          <h2>5. Your Rights &amp; Contact</h2>
          <p>
            If you have questions regarding data privacy or wish to request removal of submitted feedback, contact our data protection team at <code>privacy@truefactnews.com</code>.
          </p>
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
}
