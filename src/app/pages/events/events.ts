import { Component, OnInit, computed, inject } from '@angular/core';

import { AdminEventsStore } from '../../admin-events.store';
import { AdminEvent } from '../../events.models';
import { EditableTextComponent } from '../../shared/editable-text/editable-text';
import { parseEventDate } from '../../shared/utils/event-date';

type DisplayEvent = AdminEvent & {
  parsedDate: Date | null;
  displayKey: string;
};

@Component({
  imports: [EditableTextComponent],
  templateUrl: './events.html',
  styleUrl: './events.scss',
})
export class EventsPage implements OnInit {
  private readonly adminEventsStore = inject(AdminEventsStore);

  readonly isLoading = this.adminEventsStore.isLoading;
  readonly errorMessage = this.adminEventsStore.loadError;
  readonly combinedEvents = computed<DisplayEvent[]>(() =>
    this.adminEventsStore.events().map((event) => toDisplayEvent(event, `admin-${event.id}`)),
  );
  readonly upcomingEvents = computed(() => getUpcomingEvents(this.combinedEvents()));
  readonly pastEvents = computed(() => getPastEvents(this.combinedEvents()));

  async ngOnInit(): Promise<void> {
    await this.adminEventsStore.ensureEventsLoaded();
  }
}

function toDisplayEvent(
  event: AdminEvent,
  displayKey: string,
): DisplayEvent {
  return {
    ...event,
    parsedDate: parseEventDate(event.startsAt),
    displayKey,
  };
}

function getUpcomingEvents(events: DisplayEvent[]): DisplayEvent[] {
  const now = Date.now();

  return [...events]
    .filter((event) => !event.parsedDate || event.parsedDate.getTime() >= now)
    .sort((left, right) => {
      const leftValue = left.parsedDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightValue = right.parsedDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftValue - rightValue;
    });
}

function getPastEvents(events: DisplayEvent[]): DisplayEvent[] {
  const now = Date.now();

  return [...events]
    .filter((event) => event.parsedDate && event.parsedDate.getTime() < now)
    .sort(
      (left, right) =>
        (right.parsedDate?.getTime() ?? 0) - (left.parsedDate?.getTime() ?? 0),
    );
}
