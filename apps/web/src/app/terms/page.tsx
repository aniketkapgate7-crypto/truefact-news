import { EditorialHeader } from "@/components/editorial/EditorialHeader";
import { EditorialFooter } from "@/components/editorial/EditorialFooter";

export const metadata = {
  title: "Terms of Service — TrueFact News",
  description: "Read the TrueFact News terms of service, acceptable use guidelines, and platform disclaimers.",
};

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#FFFFFF] dark:bg-[#0B0F17]">
      <EditorialHeader />

      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 space-y-8">
        <div className="space-y-3 border-b border-gray-200 dark:border-gray-800 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E5242A]">
            Terms &amp; Disclaimers
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500">Last updated: August 2026</p>
        </div>

        <section className="space-y-6 editorial-prose text-xs sm:text-sm">
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or using TrueFact News (the &ldquo;Platform&rdquo;), you agree to abide by these Terms of Service. If you do not agree with any part of these terms, please do not use the Platform.
          </p>

          <h2>2. Use of Credibility Metrics &amp; Disclaimers</h2>
          <p>
            TrueFact News provides automated credibility assessments and human-reviewed fact-checks for informational purposes. While our algorithms and journalists adhere to rigorous verification methodologies, credibility scores do not constitute legal, medical, or financial advice, nor do they guarantee absolute truth.
          </p>

          <h2>3. Intellectual Property &amp; Citations</h2>
          <p>
            All original fact-check reports, editorial analyses, and software architecture are the property of TrueFact News. Fair citation and linking to our reports with proper attribution is welcomed and encouraged.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>
            Users agree not to:
          </p>
          <ul>
            <li>Submit abusive, defamatory, or fraudulent material to our verification desk.</li>
            <li>Attempt to probe, reverse-engineer, or disrupt the platform’s security or rate limits.</li>
            <li>Misrepresent automated credibility signals as official government or judicial certifications.</li>
          </ul>

          <h2>5. Changes &amp; Governing Law</h2>
          <p>
            We reserve the right to update these terms periodically. Continued use of the platform constitutes acceptance of revised terms.
          </p>
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
}
