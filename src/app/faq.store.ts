import { Injectable, computed, inject, signal } from '@angular/core';

import { AdminEventsStore } from './admin-events.store';
import { FaqEntry, FaqEntryInput } from './faq.models';
import { faqItems } from './site-data';
import { getSupabaseClient } from './supabase.client';
import { assertAdminAccess } from './shared/utils/admin-access';
import { getErrorMessage } from './shared/utils/error-message';

type FaqEntryRow = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type SeedSummary = {
  created: number;
  skipped: number;
};

@Injectable({ providedIn: 'root' })
export class FaqStore {
  private readonly supabase = getSupabaseClient();
  private readonly adminEventsStore = inject(AdminEventsStore);
  private loadPromise: Promise<void> | null = null;

  readonly remoteItems = signal<FaqEntry[] | null>(null);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly syncError = signal<string | null>(null);
  readonly usingFallback = computed(() => this.remoteItems() === null);
  readonly items = computed(() => this.remoteItems() ?? defaultFaqEntries);

  constructor() {
    void this.ensureLoaded();
  }

  async ensureLoaded(): Promise<void> {
    if (!this.supabase) {
      return;
    }

    if (!this.loadPromise) {
      this.loadPromise = this.loadFaqEntries().finally(() => {
        this.loadPromise = null;
      });
    }

    await this.loadPromise;
  }

  async saveFaqEntry(value: FaqEntryInput, faqId?: string): Promise<FaqEntry> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    assertAdminAccess(this.adminEventsStore.isAdmin());
    await this.ensureLoaded();

    const question = value.question.trim();
    const answer = value.answer.trim();
    if (!question || !answer) {
      throw new Error('Bitte Frage und Antwort ausfuellen.');
    }

    const existingEntry = faqId
      ? (this.remoteItems() ?? []).find((item) => item.id === faqId)
      : undefined;
    const row = {
      question,
      answer,
      sort_order: existingEntry?.sortOrder ?? getNextSortOrder(this.remoteItems()),
    };

    this.isSaving.set(true);
    this.syncError.set(null);

    try {
      const operation = existingEntry
        ? this.supabase.from('faq_items').update(row).eq('id', existingEntry.id)
        : this.supabase.from('faq_items').insert(row);
      const { data, error } = await operation.select('*').single();

      if (error || !data) {
        throw error ?? new Error('Der FAQ-Eintrag konnte nicht gespeichert werden.');
      }

      const savedEntry = mapRowToFaqEntry(data as FaqEntryRow);
      const nextItems = existingEntry
        ? (this.remoteItems() ?? []).map((item) =>
            item.id === existingEntry.id ? savedEntry : item,
          )
        : [...(this.remoteItems() ?? []), savedEntry];

      this.remoteItems.set(sortFaqEntries(nextItems));
      return savedEntry;
    } catch (error) {
      this.syncError.set(getErrorMessage(error, 'Der FAQ-Eintrag konnte nicht gespeichert werden.'));
      throw error;
    } finally {
      this.isSaving.set(false);
    }
  }

  async deleteFaqEntry(faqId: string): Promise<void> {
    if (!this.supabase) {
      throw new Error('Supabase ist noch nicht konfiguriert.');
    }

    assertAdminAccess(this.adminEventsStore.isAdmin());

    this.isSaving.set(true);
    this.syncError.set(null);

    try {
      const { error } = await this.supabase.from('faq_items').delete().eq('id', faqId);
      if (error) {
        throw error;
      }

      this.remoteItems.update((items) => (items ?? []).filter((item) => item.id !== faqId));
    } catch (error) {
      this.syncError.set(getErrorMessage(error, 'Der FAQ-Eintrag konnte nicht geloescht werden.'));
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

    if ((this.remoteItems() ?? []).length) {
      return { created: 0, skipped: defaultFaqEntries.length };
    }

    this.isSaving.set(true);
    this.syncError.set(null);

    try {
      const { data, error } = await this.supabase
        .from('faq_items')
        .insert(
          defaultFaqEntries.map((item, index) => ({
            question: item.question,
            answer: item.answer,
            sort_order: index,
          })),
        )
        .select('*');

      if (error) {
        throw error;
      }

      this.remoteItems.set(sortFaqEntries((data ?? []).map((row) => mapRowToFaqEntry(row as FaqEntryRow))));

      return {
        created: defaultFaqEntries.length,
        skipped: 0,
      };
    } catch (error) {
      this.syncError.set(getErrorMessage(error, 'Die FAQ-Standardfragen konnten nicht geschrieben werden.'));
      throw error;
    } finally {
      this.isSaving.set(false);
    }
  }

  private async loadFaqEntries(): Promise<void> {
    if (!this.supabase) {
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const { data, error } = await this.supabase
        .from('faq_items')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      this.remoteItems.set(sortFaqEntries((data ?? []).map((row) => mapRowToFaqEntry(row as FaqEntryRow))));
    } catch (error) {
      this.loadError.set(getErrorMessage(error, 'Die FAQ konnten nicht geladen werden.'));
      this.remoteItems.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }
}

const defaultFaqEntries: FaqEntry[] = faqItems.map((item, index) => ({
  id: `default-${index}`,
  question: item.question,
  answer: item.answer,
  sortOrder: index,
  createdAt: '',
  updatedAt: '',
}));

function mapRowToFaqEntry(row: FaqEntryRow): FaqEntry {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortFaqEntries(items: FaqEntry[]): FaqEntry[] {
  return [...items].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }
    return left.createdAt.localeCompare(right.createdAt);
  });
}

function getNextSortOrder(items: FaqEntry[] | null): number {
  if (!items?.length) {
    return 0;
  }

  return Math.max(...items.map((item) => item.sortOrder)) + 1;
}
