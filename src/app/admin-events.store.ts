import { Injectable, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';

import {
  AdminEvent,
  AdminEventInput,
  DEFAULT_EVENT_IMAGE_URL,
  DEFAULT_EVENT_SOURCE_LABEL,
  ImportSummary,
  ScrapedEvent,
  ScrapeEventsResponse,
  ScrapeImportSummary,
} from './events.models';
import { getSupabaseClient, isSupabaseConfigured } from './supabase.client';
import { assertAdminAccess as assertAdmin } from './shared/utils/admin-access';
import { createId } from './shared/utils/id';
import { getErrorMessage } from './shared/utils/error-message';

type EventRow = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  starts_at: string;
  venue: string | null;
  address: string | null;
  city: string | null;
  organizer: string | null;
  source_label: string | null;
  slug: string;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

type EventMutationRow = {
  title: string;
  description: string;
  image_url: string;
  starts_at: string;
  venue: string | null;
  address: string | null;
  city: string | null;
  organizer: string | null;
  source_label: string;
  slug: string;
  source_url: string | null;
};

const EVENT_IMAGES_BUCKET = 'event-images';

@Injectable({ providedIn: 'root' })
export class AdminEventsStore {
  private readonly supabase = getSupabaseClient();
  private loadPromise: Promise<void> | null = null;

  readonly events = signal<AdminEvent[]>([]);
  readonly session = signal<Session | null>(null);
  readonly isAdmin = signal(false);
  readonly isConfigured = signal(isSupabaseConfigured());
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly authReady = signal(!this.supabase);
  readonly loadError = signal<string | null>(null);
  readonly setupMessage = signal<string | null>(
    this.supabase
      ? null
      : 'Supabase ist noch nicht konfiguriert. Trage URL und Publishable Key in den Environment-Dateien ein.',
  );
  readonly syncError = signal<string | null>(null);

  constructor() {
    void this.initialize();
  }

  async ensureEventsLoaded(): Promise<void> {
    if (!this.supabase) {
      return;
    }

    if (!this.loadPromise) {
      this.loadPromise = this.loadEvents().finally(() => {
        this.loadPromise = null;
      });
    }

    await this.loadPromise;
  }

  async signIn(email: string, password: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw error;
    }

    await this.updateSession(data.session);
    await this.ensureEventsLoaded();
  }

  async signOut(): Promise<void> {
    if (!this.supabase) {
      return;
    }

    const { error } = await this.supabase.auth.signOut();

    if (error) {
      throw error;
    }

    this.session.set(null);
    this.isAdmin.set(false);
  }

  async saveEvent(value: AdminEventInput, eventId?: string): Promise<AdminEvent> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    this.assertAdminAccess();

    const currentEvents = this.events();
    const existingEvent = eventId
      ? currentEvents.find((event) => event.id === eventId)
      : undefined;
    const row = buildEventMutation(value, existingEvent);

    this.isSaving.set(true);
    this.syncError.set(null);

    try {
      const operation = existingEvent
        ? this.supabase.from('events').update(row).eq('id', existingEvent.id)
        : this.supabase.from('events').insert(row);
      const { data, error } = await operation.select('*').single();

      if (error || !data) {
        throw error ?? new Error('Das Event konnte nicht gespeichert werden.');
      }

      const savedEvent = mapRowToAdminEvent(data as EventRow);
      const nextEvents = existingEvent
        ? currentEvents.map((event) => (event.id === existingEvent.id ? savedEvent : event))
        : [savedEvent, ...currentEvents];

      this.events.set(sortEvents(nextEvents));
      return savedEvent;
    } catch (error) {
      this.syncError.set(getErrorMessage(error, 'Das Event konnte nicht gespeichert werden.'));
      throw error;
    } finally {
      this.isSaving.set(false);
    }
  }

  async importEvents(events: ScrapedEvent[]): Promise<ImportSummary> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    this.assertAdminAccess();

    await this.ensureEventsLoaded();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const event of events) {
      if (!event.title?.trim() || !event.description?.trim() || !event.startsAt?.trim()) {
        skipped += 1;
        continue;
      }

      const existingEvent = this.findImportedEventMatch(event);

      await this.saveEvent(
        {
          title: event.title,
          description: event.description,
          imageUrl: event.imageUrl || DEFAULT_EVENT_IMAGE_URL,
          startsAt: event.startsAt,
          venue: event.venue ?? '',
          address: event.address ?? '',
          city: event.city ?? '',
          organizer: event.organizer ?? '',
          sourceLabel: event.sourceLabel ?? 'Importiert',
          sourceUrl: event.sourceUrl ?? '',
          slug: event.slug,
        },
        existingEvent?.id,
      );

      if (existingEvent) {
        updated += 1;
      } else {
        created += 1;
      }
    }

    return { created, updated, skipped };
  }

  async scrapeAndImportEvents(urls: string[]): Promise<ScrapeImportSummary> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    this.assertAdminAccess();

    const normalizedUrls = uniqueUrls(urls);
    if (!normalizedUrls.length) {
      throw new Error('Bitte mindestens eine gueltige URL angeben.');
    }

    this.syncError.set(null);

    const { data, error } = await this.supabase.functions.invoke('scrape-events', {
      body: {
        urls: normalizedUrls,
      },
    });

    if (error || !data) {
      this.syncError.set(
        getErrorMessage(error, 'Die Event-Quellen konnten nicht serverseitig geladen werden.'),
      );
      throw error ?? new Error('Die Event-Quellen konnten nicht geladen werden.');
    }

    const payload = data as ScrapeEventsResponse;
    const results = payload.results ?? [];
    const importSummary = await this.importEvents(payload.events ?? []);

    return {
      ...importSummary,
      processed: results.length,
      failed: results.filter((result) => !result.event).length,
      results,
    };
  }

  async uploadEventImage(file: File): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    this.assertAdminAccess();

    if (file.type && !file.type.startsWith('image/')) {
      throw new Error('Bitte nur Bilddateien hochladen.');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Bitte nur Bilder bis maximal 5 MB hochladen.');
    }

    const fileExtension = getFileExtension(file.name);
    const filePath = `events/${createId()}${fileExtension ? `.${fileExtension}` : ''}`;

    this.syncError.set(null);

    const { error } = await this.supabase.storage
      .from(EVENT_IMAGES_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type || undefined,
        upsert: false,
      });

    if (error) {
      this.syncError.set(getErrorMessage(error, 'Das Bild konnte nicht hochgeladen werden.'));
      throw error;
    }

    const { data } = this.supabase.storage.from(EVENT_IMAGES_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  }

  async deleteEvent(eventId: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    this.assertAdminAccess();

    this.syncError.set(null);

    try {
      const { error } = await this.supabase.from('events').delete().eq('id', eventId);

      if (error) {
        throw error;
      }

      this.events.update((events) => events.filter((event) => event.id !== eventId));
    } catch (error) {
      this.syncError.set(getErrorMessage(error, 'Das Event konnte nicht geloescht werden.'));
      throw error;
    }
  }

  private async initialize(): Promise<void> {
    if (!this.supabase) {
      return;
    }

    try {
      const {
        data: { session },
      } = await this.supabase.auth.getSession();
      await this.updateSession(session);
    } catch (error) {
      this.syncError.set(getErrorMessage(error, 'Die Session konnte nicht geladen werden.'));
    } finally {
      this.authReady.set(true);
    }

    this.supabase.auth.onAuthStateChange((_event, session) => {
      void this.updateSession(session);
    });

    await this.ensureEventsLoaded();
  }

  private assertAdminAccess(): void {
    if (!this.session()) {
      throw new Error('Bitte zuerst einloggen.');
    }

    assertAdmin(this.isAdmin());
  }

  private async updateSession(session: Session | null): Promise<void> {
    this.session.set(session);

    if (!session) {
      this.isAdmin.set(false);
      return;
    }

    await this.refreshAdminStatus();
  }

  private async refreshAdminStatus(): Promise<void> {
    if (!this.supabase) {
      this.isAdmin.set(false);
      return;
    }

    const { data, error } = await this.supabase.rpc('is_admin');

    if (error) {
      this.isAdmin.set(false);
      this.syncError.set(
        getErrorMessage(error, 'Die Admin-Rechte konnten nicht geprueft werden.'),
      );
      return;
    }

    this.isAdmin.set(Boolean(data));
  }

  private async loadEvents(): Promise<void> {
    if (!this.supabase) {
      this.events.set([]);
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const { data, error } = await this.supabase
        .from('events')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }

      this.events.set(
        sortEvents((data ?? []).map((row) => mapRowToAdminEvent(row as EventRow))),
      );
    } catch (error) {
      this.loadError.set(getErrorMessage(error, 'Die Events konnten nicht geladen werden.'));
      this.events.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private findImportedEventMatch(event: ScrapedEvent): AdminEvent | undefined {
    return this.events().find(
      (existingEvent) =>
        (event.sourceUrl && existingEvent.sourceUrl === event.sourceUrl) ||
        existingEvent.slug === event.slug,
    );
  }
}

function buildEventMutation(input: AdminEventInput, existing?: AdminEvent): EventMutationRow {
  const title = input.title.trim();

  return {
    title,
    description: input.description.trim(),
    image_url: normalizeEventImageUrl(input.imageUrl),
    starts_at: input.startsAt.trim(),
    venue: toOptionalString(input.venue) ?? null,
    address: toOptionalString(input.address) ?? null,
    city: toOptionalString(input.city) ?? null,
    organizer: toOptionalString(input.organizer) ?? null,
    source_label: toOptionalString(input.sourceLabel) ?? DEFAULT_EVENT_SOURCE_LABEL,
    slug: existing?.slug ?? toOptionalString(input.slug) ?? `${slugify(title)}-${createId().slice(0, 8)}`,
    source_url: normalizeOptionalHttpUrl(input.sourceUrl) ?? null,
  };
}

function mapRowToAdminEvent(row: EventRow): AdminEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.image_url,
    startsAt: row.starts_at,
    venue: row.venue ?? undefined,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    organizer: row.organizer ?? undefined,
    sourceLabel: row.source_label ?? undefined,
    slug: row.slug,
    sourceUrl: row.source_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortEvents(events: AdminEvent[]): AdminEvent[] {
  return [...events].sort(
    (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt),
  );
}

function slugify(value: string): string {
  const normalizedValue = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalizedValue || 'event';
}

function toOptionalString(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : undefined;
}

function normalizeEventImageUrl(value: string): string {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return DEFAULT_EVENT_IMAGE_URL;
  }

  if (normalizedValue.startsWith('/')) {
    return normalizedValue;
  }

  return normalizeRequiredHttpUrl(normalizedValue, 'Bitte eine gueltige Bild-URL angeben.');
}

function normalizeOptionalHttpUrl(value: string | undefined): string | undefined {
  const normalizedValue = toOptionalString(value);
  if (!normalizedValue) {
    return undefined;
  }

  return normalizeRequiredHttpUrl(
    normalizedValue,
    'Bitte eine gueltige http- oder https-URL angeben.',
  );
}

function normalizeRequiredHttpUrl(value: string, errorMessage: string): string {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(errorMessage);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(errorMessage);
  }

  return url.toString();
}

function getFileExtension(fileName: string): string {
  const normalizedFileName = fileName.trim().toLowerCase();
  const extension = normalizedFileName.split('.').pop();

  if (!extension || extension === normalizedFileName) {
    return '';
  }

  return extension.replace(/[^a-z0-9]/g, '');
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of urls) {
    const normalizedValue = value.trim();
    if (!normalizedValue || seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    result.push(normalizedValue);
  }

  return result;
}
