import { Component, OnInit, signal } from '@angular/core';

type GeneratedEvent = {
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
  sourceUrl: string;
};

type GeneratedEventsPayload = {
  events?: GeneratedEvent[];
};

type DisplayEvent = GeneratedEvent & {
  parsedDate: Date | null;
};

const MONTHS = new Map<string, number>([
  ['january', 0],
  ['jan', 0],
  ['januar', 0],
  ['february', 1],
  ['feb', 1],
  ['februar', 1],
  ['march', 2],
  ['mar', 2],
  ['maerz', 2],
  ['märz', 2],
  ['april', 3],
  ['apr', 3],
  ['may', 4],
  ['may.', 4],
  ['mai', 4],
  ['june', 5],
  ['jun', 5],
  ['juni', 5],
  ['july', 6],
  ['jul', 6],
  ['juli', 6],
  ['august', 7],
  ['aug', 7],
  ['september', 8],
  ['sep', 8],
  ['sept', 8],
  ['october', 9],
  ['oct', 9],
  ['oktober', 9],
  ['okt', 9],
  ['november', 10],
  ['nov', 10],
  ['december', 11],
  ['dec', 11],
  ['dezember', 11],
  ['dez', 11],
]);

const WEEKDAY_PREFIX =
  /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag),?\s+/i;

@Component({
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class EventsPage implements OnInit {
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly upcomingEvents = signal<DisplayEvent[]>([]);
  readonly pastEvents = signal<DisplayEvent[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadEvents();
  }

  private async loadEvents(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const response = await fetch('/events.generated.json', {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = (await response.json()) as GeneratedEventsPayload;
      const allEvents = (payload.events ?? []).map((event) => ({
        ...event,
        parsedDate: parseEventDate(event.startsAt),
      }));
      const now = Date.now();

      const upcoming = allEvents
        .filter((event) => !event.parsedDate || event.parsedDate.getTime() >= now)
        .sort((left, right) => {
          const leftValue = left.parsedDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
          const rightValue = right.parsedDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
          return leftValue - rightValue;
        });

      const past = allEvents
        .filter((event) => event.parsedDate && event.parsedDate.getTime() < now)
        .sort((left, right) => (right.parsedDate?.getTime() ?? 0) - (left.parsedDate?.getTime() ?? 0));

      this.upcomingEvents.set(upcoming);
      this.pastEvents.set(past);
    } catch (_error) {
      this.errorMessage.set(
        'Die generierte Event-Datei konnte gerade nicht geladen werden. Bitte das JSON erneut erzeugen.',
      );
      this.upcomingEvents.set([]);
      this.pastEvents.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}

function parseEventDate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  let candidate = value.trim();
  candidate = candidate.split(' – ')[0] ?? candidate;
  candidate = candidate.split(' - ')[0] ?? candidate;
  candidate = candidate.split(' bis ')[0] ?? candidate;
  candidate = candidate.replace(WEEKDAY_PREFIX, '');
  candidate = candidate.replace(/\b(?:CET|CEST|UTC)\b/gi, '');
  candidate = candidate.replace(/\s+(?:at|um)\s+/i, ' ');
  candidate = candidate.replace(/\s+/g, ' ').trim();

  const englishMatch = candidate.match(
    /^([A-Za-zäöüÄÖÜ]+)\s+(\d{1,2}),\s*(\d{4})\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i,
  );

  if (englishMatch) {
    const [, monthName, dayValue, yearValue, hourValue, minuteValue, meridiem] = englishMatch;
    return buildDate(yearValue, monthName, dayValue, hourValue, minuteValue, meridiem);
  }

  const germanMatch = candidate.match(
    /^(\d{1,2})\.\s*([A-Za-zäöüÄÖÜ]+)\s*(\d{4})\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i,
  );

  if (germanMatch) {
    const [, dayValue, monthName, yearValue, hourValue, minuteValue, meridiem] = germanMatch;
    return buildDate(yearValue, monthName, dayValue, hourValue, minuteValue, meridiem);
  }

  const numericMatch = candidate.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\s+(\d{1,2}):(\d{2})$/,
  );

  if (numericMatch) {
    const [, dayValue, monthValue, yearValue, hourValue, minuteValue] = numericMatch;
    const normalizedYear = yearValue.length === 2 ? `20${yearValue}` : yearValue;
    return new Date(
      Number(normalizedYear),
      Number(monthValue) - 1,
      Number(dayValue),
      Number(hourValue),
      Number(minuteValue),
    );
  }

  const fallback = new Date(candidate);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function buildDate(
  yearValue: string,
  monthName: string,
  dayValue: string,
  hourValue: string,
  minuteValue: string,
  meridiem?: string,
): Date | null {
  const normalizedMonth = monthName.toLowerCase().replace(/\.$/, '');
  const monthIndex = MONTHS.get(normalizedMonth);

  if (monthIndex === undefined) {
    return null;
  }

  let hour = Number(hourValue);
  if (meridiem?.toUpperCase() === 'PM' && hour < 12) {
    hour += 12;
  }
  if (meridiem?.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  return new Date(Number(yearValue), monthIndex, Number(dayValue), hour, Number(minuteValue));
}
