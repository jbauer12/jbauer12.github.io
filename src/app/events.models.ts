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

export type GeneratedEvent = EventItem;

export type GeneratedEventsPayload = {
  events?: GeneratedEvent[];
};

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
};
