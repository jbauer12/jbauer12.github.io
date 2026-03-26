export type EventItem = {
  title: string;
  description: string;
  imageUrl: string;
  startsAt: string;
  venue?: string;
  address?: string;
  city?: string;
  organizer?: string;
  sourceLabel?: string;
  slug: string;
  sourceUrl?: string;
};

export type ScrapedEvent = EventItem;

export type AdminEvent = EventItem & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminEventInput = {
  title: string;
  description: string;
  imageUrl: string;
  startsAt: string;
  venue: string;
  address: string;
  city: string;
  organizer: string;
  sourceLabel: string;
  sourceUrl: string;
  slug?: string;
};

export type ImportSummary = {
  created: number;
  updated: number;
  skipped: number;
};

export type ScrapeSourceResult = {
  url: string;
  event?: ScrapedEvent;
  errors: string[];
  extractionChain: string[];
};

export type ScrapeEventsResponse = {
  events: ScrapedEvent[];
  results: ScrapeSourceResult[];
};

export type ScrapeImportSummary = ImportSummary & {
  processed: number;
  failed: number;
  results: ScrapeSourceResult[];
};
