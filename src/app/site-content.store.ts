import { Injectable, computed, inject, signal } from '@angular/core';

import { AdminEventsStore } from './admin-events.store';
import { getSupabaseClient } from './supabase.client';

type SiteContentRow = {
  key: string;
  value: string;
  updated_at?: string;
};

type SeedSummary = {
  created: number;
  skipped: number;
};

@Injectable({ providedIn: 'root' })
export class SiteContentStore {
  private readonly supabase = getSupabaseClient();
  private readonly adminEventsStore = inject(AdminEventsStore);
  private loadPromise: Promise<void> | null = null;

  readonly contentMap = signal<Record<string, string>>({});
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly syncError = signal<string | null>(null);
  readonly canEdit = computed(() => this.adminEventsStore.isAdmin());

  constructor() {
    void this.ensureLoaded();
  }

  value(key: string, fallback: string): string {
    return this.contentMap()[key] ?? fallback;
  }

  async ensureLoaded(): Promise<void> {
    if (!this.supabase) {
      return;
    }

    if (!this.loadPromise) {
      this.loadPromise = this.loadContent().finally(() => {
        this.loadPromise = null;
      });
    }

    await this.loadPromise;
  }

  async saveContent(key: string, value: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    assertAdminAccess(this.adminEventsStore.isAdmin());

    this.isSaving.set(true);
    this.syncError.set(null);

    const normalizedValue = value.replace(/\r\n/g, '\n').trim();

    try {
      const { error } = await this.supabase
        .from('site_content')
        .upsert(
          {
            key,
            value: normalizedValue,
          },
          {
            onConflict: 'key',
          },
        );

      if (error) {
        throw error;
      }

      this.contentMap.update((map) => ({
        ...map,
        [key]: normalizedValue,
      }));
    } catch (error) {
      this.syncError.set(getErrorMessage(error, 'Der Inhalt konnte nicht gespeichert werden.'));
      throw error;
    } finally {
      this.isSaving.set(false);
    }
  }

  async seedDefaults(): Promise<SeedSummary> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    assertAdminAccess(this.adminEventsStore.isAdmin());

    await this.ensureLoaded();

    const { siteContentDefaults } = await import('./site-content.defaults');

    const currentMap = this.contentMap();
    const missingEntries = siteContentDefaults.filter((entry) => currentMap[entry.key] === undefined);

    if (!missingEntries.length) {
      return {
        created: 0,
        skipped: siteContentDefaults.length,
      };
    }

    this.isSaving.set(true);
    this.syncError.set(null);

    try {
      const { error } = await this.supabase.from('site_content').insert(
        missingEntries.map((entry) => ({
          key: entry.key,
          value: entry.value,
        })),
      );

      if (error) {
        throw error;
      }

      this.contentMap.update((map) => {
        const nextMap = { ...map };
        for (const entry of missingEntries) {
          nextMap[entry.key] = entry.value;
        }
        return nextMap;
      });

      return {
        created: missingEntries.length,
        skipped: siteContentDefaults.length - missingEntries.length,
      };
    } catch (error) {
      this.syncError.set(getErrorMessage(error, 'Die Standardtexte konnten nicht geschrieben werden.'));
      throw error;
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadContent(): Promise<void> {
    if (!this.supabase) {
      return;
    }

    this.isLoading.set(true);
    this.syncError.set(null);

    try {
      const { data, error } = await this.supabase
        .from('site_content')
        .select('key, value, updated_at');

      if (error) {
        throw error;
      }

      const nextMap: Record<string, string> = {};

      for (const row of (data ?? []) as SiteContentRow[]) {
        nextMap[row.key] = row.value;
      }

      this.contentMap.set(nextMap);
    } catch (error) {
      this.syncError.set(getErrorMessage(error, 'Die Seitentexte konnten nicht geladen werden.'));
    } finally {
      this.isLoading.set(false);
    }
  }
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

function assertAdminAccess(isAdmin: boolean): void {
  if (!isAdmin) {
    throw new Error('Bitte mit einem freigeschalteten Admin-Account im Maschinenraum einloggen.');
  }
}
