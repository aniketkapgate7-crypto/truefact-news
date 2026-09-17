import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { NewsProvider } from "@/context/NewsContext";
import { AuthProvider } from "@/components/auth/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrueFact News — Read the news. See the evidence. Check the claim.",
  description:
    "A modern news platform where every story includes transparent credibility information, multi-source corroboration, and traceable evidence.",
  keywords: [
    "news",
    "fact check",
    "credibility",
    "breaking news",
    "journalism",
    "verified news",
    "evidence",
  ],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "TrueFact News — Read the news. See the evidence. Check the claim.",
    description:
      "A modern news platform with transparent credibility scores and traceable evidence.",
    type: "website",
    siteName: "TrueFact News",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueFact News",
    description: "Read the news. See the evidence. Check the claim.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable}`}
    >
      <head>
        {/* No-flash theme reader: reads localStorage before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tf-theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-white dark:bg-[#0B0F17] text-[#111827] dark:text-[#F3F4F6] transition-colors">
        <AuthProvider>
          <NewsProvider>{children}</NewsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
