import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { NewsProvider } from "@/context/NewsContext";
import { AIAssistantWidget } from "@/components/AIAssistantWidget";
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
  title: "TrueFact News — News You Can Verify",
  description:
    "Real-time news ranked by credibility & truthiness %. Multi-source verification, Gemini AI fact-checking, and live stream analysis.",
  keywords: ["news", "fact check", "credibility", "breaking news", "journalism", "AI fact check"],
  openGraph: {
    title: "TrueFact News",
    description: "News you can verify. Credibility-ranked stories in real time with Gemini AI.",
    type: "website",
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
        {/* No-flash dark mode: reads localStorage before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('tf-theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        <NewsProvider>
          {children}
          {/* Floating Context-Aware Gemini AI Assistant */}
          <AIAssistantWidget />
        </NewsProvider>
      </body>
    </html>
  );
}
