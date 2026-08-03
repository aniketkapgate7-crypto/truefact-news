export type Category =
  | "Breaking"
  | "Politics"
  | "World"
  | "Business"
  | "Tech"
  | "Science"
  | "Sports"
  | "Entertainment"
  | "Lifestyle";

export type Region = "Global" | "USA" | "India" | "UK" | "Europe" | "Asia";

export interface RegionFilterItem {
  id: string;
  name: string;
  flag: string;
  code: Region | "All";
}

export const REGION_LIST: RegionFilterItem[] = [
  { id: "all", name: "All Regions", flag: "🌐", code: "All" },
  { id: "global", name: "Global / Intl", flag: "🌍", code: "Global" },
  { id: "india", name: "India", flag: "🇮🇳", code: "India" },
  { id: "usa", name: "United States", flag: "🇺🇸", code: "USA" },
  { id: "uk", name: "United Kingdom", flag: "🇬🇧", code: "UK" },
  { id: "europe", name: "Europe (EU)", flag: "🇪🇺", code: "Europe" },
  { id: "asia", name: "Asia-Pacific", flag: "🇯🇵", code: "Asia" },
];

export type SourceType = "global_channel" | "social" | "fact_checker" | "official";

export type VerificationStatus = "verified" | "partial" | "disputed" | "unverified";

export interface SourceVerification {
  name: string;
  type: SourceType;
  status: VerificationStatus;
  matchScore: number;
  detail: string;
  url?: string;
}

export type RedFlagSeverity = "high" | "medium" | "low" | "positive";

export interface RedFlagItem {
  id: string;
  title: string;
  category: "Visual On-Screen" | "Anchoring & Bias" | "Sourcing & Attribution" | "Fact-Check Match" | "Regulatory Portal";
  severity: RedFlagSeverity;
  description: string;
}

export interface BiasAnalysis {
  politicalLean: number;
  sensationalismScore: number;
  tone: "Neutral / Fact-based" | "Sensationalized" | "Alarmist" | "Opinion / Analysis";
  emotionalTriggersCount: number;
  readingEaseScore: number;
}

export interface OfficialPortalCheck {
  name: string;
  category: "Fact-Checker" | "Official Regulatory" | "Government Press";
  status: "Verified True" | "Context Added" | "Debunked" | "Under Review";
  verifiedAt: string;
  url: string;
  summary: string;
}

export interface TruthAnalysis {
  truthScore: number;
  truthGrade: "Highly Verified" | "Mostly True" | "Mixed / Context Needed" | "High Risk / Disputed";
  sourceVerifications: SourceVerification[];
  redFlags: RedFlagItem[];
  biasAnalysis: BiasAnalysis;
  officialPortals: OfficialPortalCheck[];
}

export interface NewsArticle {
  id: number;
  category: Category;
  headline: string;
  summary: string;
  body?: string;
  source: string;
  author: string;
  publishedAt: string;
  readTime: number;
  credibilityScore: number;
  truthAnalysis: TruthAnalysis;
  region: Region;
  countryFlag: string;
  imageUrl: string;
  imageBg: string;
}

export type TickerItem = { id: number; text: string; category: Category };

export interface LiveStreamChannel {
  id: string;
  name: string;
  channel: string;
  embedId: string;
  badge: "BREAKING LIVE" | "OFFICIAL STREAM" | "24/7 BROADCAST";
  viewerCount: string;
  description: string;
}

/* ─── Default Truth Analysis Data ─────────────────────────────── */

const defaultTruthAnalysis: TruthAnalysis = {
  truthScore: 94,
  truthGrade: "Highly Verified",
  sourceVerifications: [
    { name: "Reuters", type: "global_channel", status: "verified", matchScore: 98, detail: "Primary wire report corroborated by 14 international bureaus." },
    { name: "AP News", type: "global_channel", status: "verified", matchScore: 96, detail: "On-the-ground diplomatic correspondent confirmed statement." },
    { name: "BBC News", type: "global_channel", status: "verified", matchScore: 95, detail: "Live stream alignment verified by automated transcript matcher." },
    { name: "Google News Signals", type: "social", status: "verified", matchScore: 92, detail: "High cluster density (>4,500 independent articles indexed)." },
    { name: "Twitter / X Verified Feed", type: "social", status: "verified", matchScore: 89, detail: "Official UN Spokesperson verified account tweet timestamped at 04:12 UTC." },
    { name: "Instagram News Outlets", type: "social", status: "partial", matchScore: 78, detail: "Infographics accurately quote press release; minor sensational headline framing." },
    { name: "Snopes", type: "fact_checker", status: "verified", matchScore: 99, detail: "Claim check marked TRUE: Emergency session officially convened." },
    { name: "PolitiFact", type: "fact_checker", status: "verified", matchScore: 97, detail: "No misleading claims detected in primary statements." },
    { name: "Boom Live", type: "fact_checker", status: "verified", matchScore: 94, detail: "Image reverse search shows zero archived misattributions." },
    { name: "Alt News", type: "fact_checker", status: "verified", matchScore: 95, detail: "Cross-referenced audio transcripts matched official release." },
    { name: "UN Press Portal", type: "official", status: "verified", matchScore: 100, detail: "Official resolution draft #2026-889 published on official portal." }
  ],
  redFlags: [
    {
      id: "rf-1",
      title: "Multiple Independent Sources",
      category: "Sourcing & Attribution",
      severity: "positive",
      description: "Corroborated across 5+ tier-1 global wire services and official UN portal."
    },
    {
      id: "rf-2",
      title: "Neutral Anchoring Language",
      category: "Anchoring & Bias",
      severity: "positive",
      description: "Objective reporting style; avoids emotive adjectives or unverified speculation."
    },
    {
      id: "rf-3",
      title: "On-Screen Visual Flag: Stock Imagery Warning",
      category: "Visual On-Screen",
      severity: "low",
      description: "Thumbnail uses representative archive satellite footage; clearly labeled as file photo."
    },
    {
      id: "rf-4",
      title: "IFCN Fact-Checker Consensus",
      category: "Fact-Check Match",
      severity: "positive",
      description: "100% agreement across Snopes, PolitiFact, and Boom Live database checks."
    }
  ],
  biasAnalysis: {
    politicalLean: 2,
    sensationalismScore: 14,
    tone: "Neutral / Fact-based",
    emotionalTriggersCount: 1,
    readingEaseScore: 68
  },
  officialPortals: [
    {
      name: "Snopes Fact Check",
      category: "Fact-Checker",
      status: "Verified True",
      verifiedAt: "2026-07-30T04:30:00Z",
      url: "https://www.snopes.com",
      summary: "Emergency UN session officially confirmed by Council Secretariat."
    },
    {
      name: "PolitiFact Truth-O-Meter",
      category: "Fact-Checker",
      status: "Verified True",
      verifiedAt: "2026-07-30T04:45:00Z",
      url: "https://www.politifact.com",
      summary: "Statements by Secretary-General accurately represented."
    },
    {
      name: "Boom Live India",
      category: "Fact-Checker",
      status: "Verified True",
      verifiedAt: "2026-07-30T05:00:00Z",
      url: "https://www.boomlive.in",
      summary: "Viral social clips confirmed authentic footage from floor."
    },
    {
      name: "Alt News Verification",
      category: "Fact-Checker",
      status: "Verified True",
      verifiedAt: "2026-07-30T05:10:00Z",
      url: "https://www.altnews.in",
      summary: "Dual-source verification complete."
    },
    {
      name: "UN Official Press Portal",
      category: "Government Press",
      status: "Verified True",
      verifiedAt: "2026-07-30T04:15:00Z",
      url: "https://press.un.org",
      summary: "Document Ref: UNSC-2026-EM-04 published."
    }
  ]
};

/* ─── Mock Articles List ─────────────────────────────────────────── */

export const allNewsArticles: NewsArticle[] = [
  // 1. Global Breaking Hero
  {
    id: 1,
    category: "Breaking",
    headline:
      "UN Security Council Calls Emergency Session As Geopolitical Tensions Escalate Across Three Continents",
    summary:
      "World leaders convened an extraordinary session late Tuesday as simultaneous flashpoints in Eastern Europe, the South China Sea, and the Horn of Africa threatened to destabilize fragile diplomatic frameworks built over the past decade.",
    body: `World leaders convened an extraordinary session late Tuesday as simultaneous flashpoints threatened fragile diplomatic frameworks. The Secretary-General urged all parties to exercise maximum restraint.`,
    source: "Reuters",
    author: "Sarah Mitchell",
    publishedAt: "2026-07-30T04:15:00Z",
    readTime: 6,
    credibilityScore: 94,
    truthAnalysis: defaultTruthAnalysis,
    region: "Global",
    countryFlag: "🌐",
    imageUrl: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80",
    imageBg: "from-slate-900 via-slate-800 to-red-900",
  },
  // 2. India Breaking / Tech Hero
  {
    id: 21,
    category: "Breaking",
    headline:
      "ISRO Successfully Launches Next-Gen Chandrayaan-4 Lunar Sample Return Mission",
    summary:
      "India's space agency achieves a landmark milestone from Sriharikota as the LVM3 rocket successfully places the four-module lunar spacecraft into transfer orbit.",
    body: `ISRO successfully launched the Chandrayaan-4 mission today from the Satish Dhawan Space Centre. The multi-stage lunar mission aims to collect surface samples and return them safely to Earth.`,
    source: "PIB India / PTI",
    author: "Rajesh K. Verma",
    publishedAt: "2026-07-30T04:45:00Z",
    readTime: 5,
    credibilityScore: 98,
    truthAnalysis: {
      ...defaultTruthAnalysis,
      truthScore: 98,
      truthGrade: "Highly Verified",
      officialPortals: [
        {
          name: "PIB India Fact Check",
          category: "Government Press",
          status: "Verified True",
          verifiedAt: "2026-07-30T05:00:00Z",
          url: "https://factcheck.pib.gov.in",
          summary: "ISRO official broadcast confirms successful orbital insertion."
        }
      ]
    },
    region: "India",
    countryFlag: "🇮🇳",
    imageUrl: "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=1200&q=80",
    imageBg: "from-orange-950 via-slate-900 to-indigo-900",
  },
  // 3. USA Politics
  {
    id: 2,
    category: "Politics",
    headline:
      "Senate Passes Historic Infrastructure Bill After Marathon Overnight Session",
    summary:
      "A bipartisan coalition secured the 60-vote threshold needed to advance the $1.2 trillion package targeting roads, broadband, and clean-energy grids.",
    source: "AP",
    author: "James Kelley",
    publishedAt: "2026-07-30T03:40:00Z",
    readTime: 4,
    credibilityScore: 91,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 91 },
    region: "USA",
    countryFlag: "🇺🇸",
    imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-blue-900 via-blue-800 to-indigo-900",
  },
  // 4. USA Business
  {
    id: 3,
    category: "Business",
    headline:
      "Federal Reserve Signals Pause On Rate Hikes As Inflation Data Cools",
    summary:
      "Chair's remarks at the Jackson Hole symposium were parsed carefully by traders: futures markets now price in zero additional hikes for 2026.",
    source: "Bloomberg",
    author: "Priya Nair",
    publishedAt: "2026-07-30T02:55:00Z",
    readTime: 3,
    credibilityScore: 89,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 89 },
    region: "USA",
    countryFlag: "🇺🇸",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-emerald-900 via-emerald-800 to-teal-900",
  },
  // 5. India Business
  {
    id: 22,
    category: "Business",
    headline:
      "Reserve Bank of India Keeps Repo Rate Unchanged at 6.5% As GDP Growth Hits 7.8%",
    summary:
      "Governor Shaktikanta Das announces MPC decision, citing robust domestic macroeconomic fundamentals and controlled retail inflation.",
    source: "Economic Times",
    author: "Pooja Roy",
    publishedAt: "2026-07-30T02:30:00Z",
    readTime: 4,
    credibilityScore: 96,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 96 },
    region: "India",
    countryFlag: "🇮🇳",
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-amber-950 via-emerald-900 to-slate-900",
  },
  // 6. India Tech
  {
    id: 23,
    category: "Tech",
    headline:
      "Tata & Nvidia Partner To Build India's Largest AI Supercomputing Infrastructure Hub",
    summary:
      "Joint initiative will deploy over 16,000 GH200 Grace Hopper superchips in Bengaluru to power sovereign generative AI models.",
    source: "Livemint",
    author: "Aarav Mehta",
    publishedAt: "2026-07-30T01:45:00Z",
    readTime: 5,
    credibilityScore: 95,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 95 },
    region: "India",
    countryFlag: "🇮🇳",
    imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-purple-950 via-indigo-900 to-blue-900",
  },
  // 7. Tech OpenAI
  {
    id: 4,
    category: "Tech",
    headline:
      "OpenAI Unveils GPT-6 With Real-Time Multimodal Reasoning Capabilities",
    summary:
      "The latest model processes live video, audio, and text simultaneously, raising fresh debates about deployment safeguards and regulatory oversight.",
    source: "The Verge",
    author: "Lena Hoffmann",
    publishedAt: "2026-07-30T01:30:00Z",
    readTime: 5,
    credibilityScore: 87,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 87 },
    region: "USA",
    countryFlag: "🇺🇸",
    imageUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-purple-900 via-violet-800 to-purple-900",
  },
  // 8. India Politics
  {
    id: 7,
    category: "Politics",
    headline: "India Unveils $15B Semiconductor Manufacturing Incentive Scheme",
    summary:
      "Cabinet approves massive subsidy package attracting foreign fabrication plants to establish hubs in Gujarat and Karnataka.",
    source: "The Hindu",
    author: "Rohan Sharma",
    publishedAt: "2026-07-29T15:10:00Z",
    readTime: 4,
    credibilityScore: 93,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 93 },
    region: "India",
    countryFlag: "🇮🇳",
    imageUrl: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-amber-900 via-orange-800 to-red-900",
  },
  // 9. Europe Politics
  {
    id: 6,
    category: "Politics",
    headline: "EU Parliament Votes To Tighten AI Liability Rules For Big Tech",
    summary:
      "The sweeping regulation would make platforms legally accountable for harms caused by AI-generated content distributed at scale.",
    source: "Politico",
    author: "Claudia Bauer",
    publishedAt: "2026-07-29T18:30:00Z",
    readTime: 3,
    credibilityScore: 88,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 88 },
    region: "Europe",
    countryFlag: "🇪🇺",
    imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-indigo-900 via-indigo-800 to-blue-900",
  },
  // 10. UK World
  {
    id: 14,
    category: "World",
    headline: "UK Announces Historic Trade Agreement With ASEAN Economic Block",
    summary:
      "London signs landmark tariff reduction deal opening British pharmaceutical and finance sectors across 10 Southeast Asian nations.",
    source: "BBC News",
    author: "David Althorp",
    publishedAt: "2026-07-30T02:10:00Z",
    readTime: 4,
    credibilityScore: 94,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 94 },
    region: "UK",
    countryFlag: "🇬🇧",
    imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-blue-950 via-slate-900 to-red-900",
  },
  // 11. Japan World
  {
    id: 15,
    category: "World",
    headline: "Japan Unveils High-Speed Hydrogen Bullet Train Network Expansion",
    summary:
      "JR East begins testing zero-emission Shinkansen trains capable of speeds exceeding 360 km/h between Tokyo and Sendai.",
    source: "Nikkei Asia",
    author: "Kenji Sato",
    publishedAt: "2026-07-29T23:30:00Z",
    readTime: 5,
    credibilityScore: 96,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 96 },
    region: "Asia",
    countryFlag: "🇯🇵",
    imageUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-red-950 via-slate-900 to-rose-900",
  },
  // 12. India World
  {
    id: 16,
    category: "World",
    headline: "India Hosting Global Clean Energy & Green Hydrogen Summit in New Delhi",
    summary:
      "Over 40 international delegations gather to solidify solar grid interconnections and green ammonia trade corridors.",
    source: "NDTV",
    author: "Ananya Roy",
    publishedAt: "2026-07-29T21:15:00Z",
    readTime: 4,
    credibilityScore: 92,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 92 },
    region: "India",
    countryFlag: "🇮🇳",
    imageUrl: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-orange-900 via-amber-800 to-teal-900",
  },
  // 13. India Sports
  {
    id: 19,
    category: "Sports",
    headline: "India Secures Thrilling Victory In T20 World Cup Final Against Australia",
    summary:
      "Sensational last-over bowling performance seals a 6-run win in front of 90,000 screaming fans at Narendra Modi Stadium.",
    source: "Cricinfo",
    author: "Vikram Sethi",
    publishedAt: "2026-07-30T03:00:00Z",
    readTime: 3,
    credibilityScore: 99,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 99 },
    region: "India",
    countryFlag: "🇮🇳",
    imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-blue-900 via-indigo-900 to-amber-900",
  },
  // 14. Global Science
  {
    id: 17,
    category: "Science",
    headline: "NASA James Webb Space Telescope Detects Water Vapor On Habitable Exoplanet",
    summary:
      "Spectroscopic data from K2-18b confirms atmospheric hydrogen and chemical signatures suggestive of an ocean-covered world 120 light years away.",
    source: "NASA Science",
    author: "Dr. Elena Rostova",
    publishedAt: "2026-07-30T01:00:00Z",
    readTime: 5,
    credibilityScore: 98,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 98 },
    region: "Global",
    countryFlag: "🌐",
    imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-indigo-950 via-purple-900 to-blue-900",
  },
  // 15. UK Science
  {
    id: 18,
    category: "Science",
    headline: "Universal Cancer Vaccine Enters Phase 3 Human Clinical Trials in UK",
    summary:
      "mRNA-based personalized immunotherapy demonstrates 84% reduction in tumor recurrence during multi-center European trials.",
    source: "Lancet",
    author: "Prof. Arthur Pendelton",
    publishedAt: "2026-07-29T17:20:00Z",
    readTime: 6,
    credibilityScore: 97,
    truthAnalysis: { ...defaultTruthAnalysis, truthScore: 97 },
    region: "UK",
    countryFlag: "🇬🇧",
    imageUrl: "https://images.unsplash.com/photo-1579165466541-71e226ce4e74?auto=format&fit=crop&w=800&q=80",
    imageBg: "from-teal-950 via-cyan-900 to-emerald-900",
  }
];

export const heroArticle: NewsArticle = allNewsArticles[0];

export const secondaryArticles: NewsArticle[] = allNewsArticles.slice(1, 4);

export const politicsArticles: NewsArticle[] = allNewsArticles.filter(
  (a) => a.category === "Politics"
);

export const worldArticles: NewsArticle[] = allNewsArticles.filter(
  (a) => a.category === "World"
);

export const businessArticles: NewsArticle[] = allNewsArticles.filter(
  (a) => a.category === "Business"
);

export const techArticles: NewsArticle[] = allNewsArticles.filter(
  (a) => a.category === "Tech"
);

export const scienceArticles: NewsArticle[] = allNewsArticles.filter(
  (a) => a.category === "Science"
);

export const sportsArticles: NewsArticle[] = allNewsArticles.filter(
  (a) => a.category === "Sports"
);

export const tickerItems: TickerItem[] = [
  { id: 1, text: "Markets: S&P 500 +0.8%  |  NIFTY 50 +1.1%  |  NASDAQ +1.2%", category: "Business" },
  { id: 2, text: "ISRO launches Chandrayaan-4 lunar sample return mission from Sriharikota", category: "Breaking" },
  { id: 3, text: "BREAKING — Emergency UN session underway on geopolitical tensions", category: "Breaking" },
  { id: 4, text: "India wins T20 World Cup Final against Australia in thriller", category: "Sports" },
  { id: 5, text: "Tata & Nvidia announce $2B AI Supercomputing Hub in Bengaluru", category: "Tech" },
  { id: 6, text: "RBI keeps repo rate unchanged at 6.5% as GDP growth hits 7.8%", category: "Business" },
  { id: 7, text: "JWST detects atmospheric water vapor on exoplanet K2-18b", category: "Science" },
  { id: 8, text: "WHO: Global flu season severity rated 'moderate' for 2026", category: "World" },
];

/* ─── Live Streams List ─────────────────────────────────────────── */

export const liveChannels: LiveStreamChannel[] = [
  {
    id: "bbc",
    name: "BBC News Live",
    channel: "BBC World News",
    embedId: "gCNeDWCI0vo",
    badge: "BREAKING LIVE",
    viewerCount: "142K watching",
    description: "24/7 global news coverage with live automated transcript analysis."
  },
  {
    id: "ndtv",
    name: "NDTV 24x7 Live",
    channel: "NDTV India",
    embedId: "WB-y7_n6W-o",
    badge: "24/7 BROADCAST",
    viewerCount: "88K watching",
    description: "India & South Asia continuous news stream with fact-check ticker."
  },
  {
    id: "aljazeera",
    name: "Al Jazeera English Live",
    channel: "Al Jazeera",
    embedId: "bNyUyrR0PHo",
    badge: "BREAKING LIVE",
    viewerCount: "210K watching",
    description: "International breaking news and independent field reporting."
  },
  {
    id: "wion",
    name: "WION World Is One",
    channel: "WION",
    embedId: "V93_f-Fv74w",
    badge: "OFFICIAL STREAM",
    viewerCount: "65K watching",
    description: "Global opinion, geopolitical analysis, and live debate."
  }
];

/* ─── Official Verification Portals Directory ─────────────────────── */

export const officialPortalDirectory = [
  {
    name: "Snopes",
    type: "Fact-Checker Portal",
    url: "https://www.snopes.com",
    searchUrl: "https://www.snopes.com/?s=",
    logoText: "Snopes",
    color: "bg-red-600",
    badge: "IFCN Certified",
    description: "Oldest and largest online fact-checking site."
  },
  {
    name: "Boom Live",
    type: "Fact-Checker Portal",
    url: "https://www.boomlive.in",
    searchUrl: "https://www.boomlive.in/search?q=",
    logoText: "BOOM",
    color: "bg-amber-600",
    badge: "IFCN Certified",
    description: "Independent digital fact-checking organization combating misinformation."
  },
  {
    name: "Alt News",
    type: "Fact-Checker Portal",
    url: "https://www.altnews.in",
    searchUrl: "https://www.altnews.in/?s=",
    logoText: "Alt News",
    color: "bg-blue-600",
    badge: "IFCN Certified",
    description: "Dedicated to debunking fake news, viral claims, and media bias."
  },
  {
    name: "PolitiFact",
    type: "Fact-Checker Portal",
    url: "https://www.politifact.com",
    searchUrl: "https://www.politifact.com/search/?q=",
    logoText: "PolitiFact",
    color: "bg-indigo-600",
    badge: "Pulitzer Winner",
    description: "Truth-O-Meter rating scale for political statements."
  },
  {
    name: "Google Fact Check Explorer",
    type: "Aggregator API",
    url: "https://toolbox.google.com/factcheck/explorer",
    searchUrl: "https://toolbox.google.com/factcheck/explorer/search/",
    logoText: "Google FC",
    color: "bg-emerald-600",
    badge: "Global Index",
    description: "Search claims indexed by Google Fact Check Markup."
  },
  {
    name: "PIB Fact Check (Government)",
    type: "Official Regulatory",
    url: "https://factcheck.pib.gov.in",
    searchUrl: "https://factcheck.pib.gov.in",
    logoText: "PIB Govt",
    color: "bg-purple-600",
    badge: "Official Govt",
    description: "Official press bureau fact-checking unit for government policies."
  },
  {
    name: "WHO Mythbusters",
    type: "Health & Official",
    url: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters",
    searchUrl: "https://www.who.int/home/search?indexCatalog=genericsearch&searchQuery=",
    logoText: "WHO",
    color: "bg-sky-600",
    badge: "UN Health",
    description: "Official World Health Organization health verification."
  }
];

/* ─── Helpers ───────────────────────────────────────────────────── */

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const categoryColors: Record<string, string> = {
  Breaking:      "bg-red-600 text-white",
  Politics:      "bg-blue-700 text-white",
  World:         "bg-teal-700 text-white",
  Business:      "bg-emerald-700 text-white",
  Tech:          "bg-violet-700 text-white",
  Science:       "bg-purple-700 text-white",
  Sports:        "bg-amber-600 text-white",
  Entertainment: "bg-rose-600 text-white",
  Lifestyle:     "bg-indigo-600 text-white",
};
