import Link from "next/link";

export function EditorialFooter() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-[#F6F7F9] dark:border-gray-800 dark:bg-[#080C14] text-gray-600 dark:text-gray-400 text-sm mt-auto">
      {/* Upper Newsletter / Mission Strip */}
      <div className="border-b border-[#E5E7EB] dark:border-gray-800/80 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="font-serif text-lg font-bold text-[#102A43] dark:text-white mb-1">
              Evidence Before Engagement.
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              TrueFact News calculates independent credibility metrics for every story and documents traceable primary sources before publishing verdicts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="email"
              placeholder="Enter your email for daily fact-checks..."
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3.5 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E5242A]"
            />
            <button
              type="button"
              className="rounded-lg bg-[#102A43] dark:bg-gray-800 px-4 py-2 text-xs font-bold text-white hover:bg-black transition-colors"
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Main Directory Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-3">
            <Link href="/" className="inline-block">
              <span className="font-serif text-2xl font-black text-[#102A43] dark:text-white">
                TRUE<span className="text-[#E5242A]">FACT</span>
              </span>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              A modern news platform where every story includes transparent credibility information and traceable evidence.
            </p>
            <div className="pt-2">
              <span className="inline-block rounded border border-gray-300 dark:border-gray-700 px-2 py-1 text-[11px] font-mono text-gray-600 dark:text-gray-400">
                Method: rules-v2
              </span>
            </div>
          </div>

          {/* News Desks */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102A43] dark:text-white">
              News Desks
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/?category=all" className="hover:text-[#E5242A] transition-colors">Latest Stories</Link></li>
              <li><Link href="/?region=India" className="hover:text-[#E5242A] transition-colors">India News</Link></li>
              <li><Link href="/?region=Global" className="hover:text-[#E5242A] transition-colors">World News</Link></li>
              <li><Link href="/?category=politics" className="hover:text-[#E5242A] transition-colors">Politics</Link></li>
              <li><Link href="/?category=business" className="hover:text-[#E5242A] transition-colors">Business &amp; Economy</Link></li>
              <li><Link href="/?category=tech" className="hover:text-[#E5242A] transition-colors">Technology</Link></li>
              <li><Link href="/?category=science" className="hover:text-[#E5242A] transition-colors">Science &amp; Environment</Link></li>
            </ul>
          </div>

          {/* Fact Checking */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102A43] dark:text-white">
              Fact Checking
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/fact-check" className="hover:text-[#E5242A] transition-colors">Fact Checks Hub</Link></li>
              <li><Link href="/verify" className="text-[#E5242A] font-semibold hover:underline">Verify a Claim</Link></li>
              <li><Link href="/fact-check" className="hover:text-[#E5242A] transition-colors">Dual-Screen Corroboration</Link></li>
              <li><Link href="/methodology" className="hover:text-[#E5242A] transition-colors">Sourcing Guidelines</Link></li>
              <li><Link href="/ratings" className="hover:text-[#E5242A] transition-colors">Verdicts &amp; Ratings</Link></li>
            </ul>
          </div>

          {/* Transparency & Standards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102A43] dark:text-white">
              Transparency
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/about" className="hover:text-[#E5242A] transition-colors">About TrueFact</Link></li>
              <li><Link href="/methodology" className="hover:text-[#E5242A] transition-colors">Methodology &amp; Scoring</Link></li>
              <li><Link href="/ratings" className="hover:text-[#E5242A] transition-colors">Rating System</Link></li>
              <li><Link href="/corrections" className="hover:text-[#E5242A] transition-colors">Corrections Policy</Link></li>
              <li><Link href="/funding" className="hover:text-[#E5242A] transition-colors">Funding &amp; Ownership</Link></li>
              <li><Link href="/editorial-standards" className="hover:text-[#E5242A] transition-colors">Editorial Independence</Link></li>
            </ul>
          </div>

          {/* Newsroom & Legal */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#102A43] dark:text-white">
              Newsroom &amp; Legal
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/contact" className="hover:text-[#E5242A] transition-colors">Contact Newsroom</Link></li>
              <li><Link href="/contact" className="hover:text-[#E5242A] transition-colors">Submit a Tip / Claim</Link></li>
              <li><Link href="/privacy" className="hover:text-[#E5242A] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#E5242A] transition-colors">Terms of Service</Link></li>
              <li className="pt-2">
                <Link
                  href="/workspace"
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>Editorial Workspace</span>
                  <span>↗</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} TrueFact News. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Independent Credibility Assessment Engine · Traceable Citations
          </p>
        </div>
      </div>
    </footer>
  );
}
