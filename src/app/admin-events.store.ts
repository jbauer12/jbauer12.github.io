import { Injectable, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';

import { AdminEvent, AdminEventInput } from './events.models';
import { getSupabaseClient, isSupabaseConfigured } from './supabase.client';

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

const EVENT_IMAGES_BUCKET = 'event-images';

@Injectable({ providedIn: 'root' })
export class AdminEventsStore {
  private readonly supabase = getSupabaseClient();
  private loadPromise: Promise<void> | null = null;

  readonly events = signal<AdminEvent[]>([]);
  readonly session = signal<Session | null>(null);
  readonly isConfigured = signal(isSupabaseConfigured());
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly authReady = signal(!this.supabase);
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

    this.session.set(data.session);
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
  }

  async saveEvent(value: AdminEventInput, eventId?: string): Promise<AdminEvent> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    if (!this.session()) {
      throw new Error('Bitte zuerst einloggen.');
    }

    const currentEvents = this.events();
    const existingEvent = eventId
      ? currentEvents.find((event) => event.id === eventId)
      : undefined;
    const row = buildEventRow(value, existingEvent);

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

  async uploadEventImage(file: File): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    if (!this.session()) {
      throw new Error('Bitte zuerst einloggen.');
    }

    if (file.type && !file.type.startsWith('image/')) {
      throw new Error('Bitte nur Bilddateien hochladen.');
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

    if (!this.session()) {
      throw new Error('Bitte zuerst einloggen.');
    }

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
      this.session.set(session);
    } catch (error) {
      this.syncError.set(getErrorMessage(error, 'Die Session konnte nicht geladen werden.'));
    } finally {
      this.authReady.set(true);
    }

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
    });

    await this.ensureEventsLoaded();
  }

  private async loadEvents(): Promise<void> {
    if (!this.supabase) {
      this.events.set([]);
      return;
    }

    this.isLoading.set(true);
    this.syncError.set(null);

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
      this.syncError.set(getErrorMessage(error, 'Die Events konnten nicht geladen werden.'));
      this.events.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}

function buildEventRow(input: AdminEventInput, existing?: AdminEvent): EventRow {
  const title = input.title.trim();
  const id = existing?.id ?? createId();
  const now = new Date().toISOString();

  return {
    id,
    title,
    description: input.description.trim(),
    image_url: input.imageUrl.trim() || '/logo.jpg',
    starts_at: input.startsAt.trim(),
    venue: toOptionalString(input.venue) ?? null,
    address: toOptionalString(input.address) ?? null,
    city: toOptionalString(input.city) ?? null,
    organizer: toOptionalString(input.organizer) ?? null,
    source_label: toOptionalString(input.sourceLabel) ?? 'Admin gepflegt',
    slug: existing?.slug ?? `${slugify(title)}-${id.slice(0, 8)}`,
    source_url: toOptionalString(input.sourceUrl) ?? null,
    created_at: existing?.createdAt ?? now,
    updated_at: now,
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

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return fallback;
}

function getFileExtension(fileName: string): string {
  const normalizedFileName = fileName.trim().toLowerCase();
  const extension = normalizedFileName.split('.').pop();

  if (!extension || extension === normalizedFileName) {
    return '';
  }

  return extension.replace(/[^a-z0-9]/g, '');
}
