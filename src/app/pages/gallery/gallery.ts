import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AdminEventsStore } from '../../admin-events.store';
import {
  type EventGalleryImage,
  type EventGalleryProvider,
  resolveEventGallery,
} from '../../event-gallery.repository';
import { AdminEvent } from '../../events.models';
import { EditableTextComponent } from '../../shared/editable-text/editable-text';
import { parseEventDate } from '../../shared/utils/event-date';

type GalleryEvent = AdminEvent & {
  parsedDate: Date | null;
  phase: 'upcoming' | 'past';
  phaseLabel: string;
  shortDate: string;
  locationLabel: string;
  optionLabel: string;
  galleryProvider: EventGalleryProvider;
  galleryImages: EventGalleryImage[];
  galleryCover: EventGalleryImage | null;
};

@Component({
  imports: [EditableTextComponent, RouterLink],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class GalleryPage implements OnInit {
  private readonly adminEventsStore = inject(AdminEventsStore);

  readonly isLoading = this.adminEventsStore.isLoading;
  readonly errorMessage = this.adminEventsStore.loadError;
  readonly selectedEventId = signal<string | null>(null);
  readonly selectedImageIndex = signal(0);
  readonly galleryEvents = computed<GalleryEvent[]>(() =>
    buildGalleryEvents(this.adminEventsStore.events()),
  );
  readonly upcomingEvents = computed(() =>
    this.galleryEvents().filter((event) => event.phase === 'upcoming'),
  );
  readonly archivedEvents = computed(() =>
    this.galleryEvents().filter((event) => event.phase === 'past'),
  );
  readonly selectedEvent = computed(() => {
    const events = this.galleryEvents();
    const currentId = this.selectedEventId();

    if (!events.length) {
      return null;
    }

    return currentId ? events.find((event) => event.id === currentId) ?? events[0] : events[0];
  });
  readonly selectedImages = computed(() => this.selectedEvent()?.galleryImages ?? []);
  readonly activeImageIndex = computed(() => {
    const images = this.selectedImages();

    if (!images.length) {
      return -1;
    }

    const requestedIndex = this.selectedImageIndex();
    return Math.min(Math.max(requestedIndex, 0), images.length - 1);
  });
  readonly selectedImage = computed(() => {
    const images = this.selectedImages();
    const index = this.activeImageIndex();

    if (!images.length || index < 0) {
      return null;
    }

    return images[index] ?? null;
  });
  readonly selectedImageCounter = computed(() => {
    const total = this.selectedImages().length;
    const index = this.activeImageIndex();

    if (!total || index < 0) {
      return '0 / 0';
    }

    return `${index + 1} / ${total}`;
  });

  async ngOnInit(): Promise<void> {
    await this.adminEventsStore.ensureEventsLoaded();
  }

  onEventSelect(event: Event): void {
    const selectedId = (event.target as HTMLSelectElement | null)?.value;

    if (!selectedId) {
      return;
    }

    this.setSelectedEvent(selectedId);
  }

  selectEvent(eventId: string): void {
    this.setSelectedEvent(eventId);
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  shiftImage(offset: number): void {
    const images = this.selectedImages();

    if (images.length < 2) {
      return;
    }

    const currentIndex = Math.max(this.activeImageIndex(), 0);
    const nextIndex = (currentIndex + offset + images.length) % images.length;
    this.selectedImageIndex.set(nextIndex);
  }

  private setSelectedEvent(eventId: string): void {
    const matchingEvent = this.galleryEvents().find((event) => event.id === eventId);

    if (!matchingEvent) {
      return;
    }

    this.selectedEventId.set(matchingEvent.id);
    this.selectedImageIndex.set(0);
  }
}

function buildGalleryEvents(events: AdminEvent[]): GalleryEvent[] {
  const now = Date.now();
  const mappedEvents = events
    .map((event) => mapEventToGalleryEvent(event, now))
    .filter((event) => event.galleryImages.length);
  const upcoming = mappedEvents
    .filter((event) => event.phase === 'upcoming')
    .sort(
      (left, right) =>
        (left.parsedDate?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (right.parsedDate?.getTime() ?? Number.MAX_SAFE_INTEGER),
    );
  const past = mappedEvents
    .filter((event) => event.phase === 'past')
    .sort(
      (left, right) =>
        (right.parsedDate?.getTime() ?? 0) - (left.parsedDate?.getTime() ?? 0),
    );

  return [...upcoming, ...past];
}

function mapEventToGalleryEvent(event: AdminEvent, now: number): GalleryEvent {
  const parsedDate = parseEventDate(event.startsAt);
  const phase = parsedDate && parsedDate.getTime() < now ? 'past' : 'upcoming';
  const shortDate = formatShortDate(parsedDate, event.startsAt);
  const gallery = resolveEventGallery(event);

  return {
    ...event,
    parsedDate,
    phase,
    phaseLabel: parsedDate ? (phase === 'past' ? 'Archiv' : 'Kommend') : 'Termin offen',
    shortDate,
    locationLabel: buildLocationLabel(event),
    optionLabel: `${shortDate} · ${event.title}`,
    galleryProvider: gallery.provider,
    galleryImages: gallery.images,
    galleryCover: gallery.images[0] ?? null,
  };
}

function formatShortDate(parsedDate: Date | null, fallback: string): string {
  if (!parsedDate) {
    return fallback.trim() || 'Termin folgt';
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsedDate);
}

function buildLocationLabel(event: AdminEvent): string {
  if (event.venue && event.city) {
    return `${event.venue} · ${event.city}`;
  }

  return event.venue || event.city || 'Ort folgt';
}
