export type ApiNewsArticle = {
  id: number;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  image_url?: string | null;
  category: string;
  region: string;
  published_at: string;
  evidence_score: number;
  credibility_score?: number | null;
  comment_count: number;
  repost_count: number;
};

export type ApiPaginationMetadata = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

export type ApiNewsFeedResponse = {
  items: ApiNewsArticle[];
  pagination: ApiPaginationMetadata;
};
