import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AdminEventsStore } from '../../admin-events.store';
import { AdminEvent, AdminEventInput } from '../../events.models';

type LoginDraft = {
  email: string;
  password: string;
};

@Component({
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './admin-events.html',
  styleUrl: './admin-events.scss',
})
export class AdminEventsPage {
  private readonly adminEventsStore = inject(AdminEventsStore);

  readonly events = computed(() => this.adminEventsStore.events());
  readonly session = this.adminEventsStore.session;
  readonly isConfigured = this.adminEventsStore.isConfigured;
  readonly isLoading = this.adminEventsStore.isLoading;
  readonly isSaving = this.adminEventsStore.isSaving;
  readonly authReady = this.adminEventsStore.authReady;
  readonly setupMessage = this.adminEventsStore.setupMessage;
  readonly syncError = this.adminEventsStore.syncError;
  readonly isUploadingImage = signal(false);
  readonly notice = signal(
    'Nur eingeloggt kannst du neue Events anlegen oder bestehende Eintraege aendern.',
  );
  readonly editingEventId = signal<string | null>(null);

  draft: AdminEventInput = createEmptyDraft();
  loginDraft: LoginDraft = {
    email: '',
    password: '',
  };

  constructor() {
    void this.adminEventsStore.ensureEventsLoaded();
  }

  async signIn(): Promise<void> {
    try {
      await this.adminEventsStore.signIn(this.loginDraft.email, this.loginDraft.password);
      this.loginDraft.password = '';
      this.notice.set('Login erfolgreich. Du kannst jetzt Events in Supabase pflegen.');
    } catch (error) {
      this.notice.set(getErrorMessage(error, 'Login fehlgeschlagen.'));
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.adminEventsStore.signOut();
      this.resetForm();
      this.notice.set('Du wurdest abgemeldet.');
    } catch (error) {
      this.notice.set(getErrorMessage(error, 'Abmelden fehlgeschlagen.'));
    }
  }

  async saveEvent(): Promise<void> {
    if (!this.isDraftValid()) {
      this.notice.set('Bitte mindestens Titel, Datum und Beschreibung ausfuellen.');
      return;
    }

    const isEditing = this.isEditing();

    try {
      const savedEvent = await this.adminEventsStore.saveEvent(
        this.draft,
        this.editingEventId() ?? undefined,
      );

      this.resetForm();
      this.notice.set(
        isEditing
          ? `"${savedEvent.title}" wurde aktualisiert.`
          : `"${savedEvent.title}" wurde in Supabase gespeichert.`,
      );
    } catch (error) {
      this.notice.set(getErrorMessage(error, 'Speichern fehlgeschlagen.'));
    }
  }

  async uploadImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!file) {
      return;
    }

    this.isUploadingImage.set(true);
    this.notice.set(`"${file.name}" wird hochgeladen.`);

    try {
      this.draft.imageUrl = await this.adminEventsStore.uploadEventImage(file);
      this.notice.set(`"${file.name}" wurde hochgeladen und als Eventbild gesetzt.`);
    } catch (error) {
      this.notice.set(getErrorMessage(error, 'Bild-Upload fehlgeschlagen.'));
    } finally {
      this.isUploadingImage.set(false);

      if (input) {
        input.value = '';
      }
    }
  }

  clearImage(): void {
    this.draft.imageUrl = '/logo.jpg';
    this.notice.set('Das Eventbild wurde auf das Standardbild zurueckgesetzt.');
  }

  startEditing(event: AdminEvent): void {
    this.editingEventId.set(event.id);
    this.draft = createDraftFromEvent(event);
    this.notice.set(`"${event.title}" ist jetzt im Formular geladen.`);
  }

  async deleteEvent(event: AdminEvent): Promise<void> {
    try {
      await this.adminEventsStore.deleteEvent(event.id);

      if (this.editingEventId() === event.id) {
        this.resetForm();
      }

      this.notice.set(`"${event.title}" wurde entfernt.`);
    } catch (error) {
      this.notice.set(getErrorMessage(error, 'Loeschen fehlgeschlagen.'));
    }
  }

  resetForm(): void {
    this.editingEventId.set(null);
    this.draft = createEmptyDraft();
  }

  isEditing(): boolean {
    return this.editingEventId() !== null;
  }

  private isDraftValid(): boolean {
    return Boolean(
      this.draft.title.trim() &&
        this.draft.startsAt.trim() &&
        this.draft.description.trim(),
    );
  }
}

function createEmptyDraft(): AdminEventInput {
  return {
    title: '',
    description: '',
    imageUrl: '/logo.jpg',
    startsAt: '',
    venue: '',
    address: '',
    city: '',
    organizer: '',
    sourceLabel: 'Admin gepflegt',
    sourceUrl: '',
  };
}

function createDraftFromEvent(event: AdminEvent): AdminEventInput {
  return {
    title: event.title,
    description: event.description,
    imageUrl: event.imageUrl,
    startsAt: event.startsAt,
    venue: event.venue ?? '',
    address: event.address ?? '',
    city: event.city ?? '',
    organizer: event.organizer ?? '',
    sourceLabel: event.sourceLabel ?? 'Admin gepflegt',
    sourceUrl: event.sourceUrl ?? '',
  };
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
