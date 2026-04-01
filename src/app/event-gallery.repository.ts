import { AdminEvent } from './events.models';

export type EventGalleryProvider = 'repo-folder' | 'event-poster';

export type EventGalleryImage = {
  src: string;
  alt: string;
  caption?: string;
};

export type EventGallery = {
  provider: EventGalleryProvider;
  folderPath: string;
  images: EventGalleryImage[];
};

type RepoEventGalleryEntry = {
  eventSlug: string;
  folderPath: string;
  images: EventGalleryImage[];
};

const REPO_EVENT_GALLERY_ROOT = 'public/event-galleries';

// Keep this resolver source-based so repo folders can later be swapped for Supabase storage
// without changing the gallery page contract.
const repoEventGalleryCatalog: RepoEventGalleryEntry[] = [
  {
    eventSlug: 'vaida-is-not-dead-presents-starts-x-defibruellator-x-pogo-gadgetto',
    folderPath:
      'public/event-galleries/vaida-is-not-dead-presents-starts-x-defibruellator-x-pogo-gadgetto',
    images: [
      {
        src:
          '/event-galleries/vaida-is-not-dead-presents-starts-x-defibruellator-x-pogo-gadgetto/01-poster.jpg',
        alt:
          'Posteransicht zum Event Vaida is not dead presents: STARTS x DEFIBRUELLATOR x POGO GADGETTO',
        caption: 'Auftaktmotiv aus dem lokalen Event-Ordner.',
      },
      {
        src:
          '/event-galleries/vaida-is-not-dead-presents-starts-x-defibruellator-x-pogo-gadgetto/02-detail.jpg',
        alt:
          'Zusatzbild zum Event Vaida is not dead presents: STARTS x DEFIBRUELLATOR x POGO GADGETTO',
        caption: 'Zweites Bild aus der aktuellen Repo-Galerie.',
      },
    ],
  },
  {
    eventSlug: 'netti-s-birthday-bash',
    folderPath: 'public/event-galleries/netti-s-birthday-bash',
    images: [
      {
        src: '/event-galleries/netti-s-birthday-bash/01-poster.jpg',
        alt: 'Posteransicht zum Event Netti s Birthday Bash',
        caption: 'Erstes Motiv aus dem lokalen Event-Ordner.',
      },
      {
        src: '/event-galleries/netti-s-birthday-bash/02-detail.jpg',
        alt: 'Zusatzbild zum Event Netti s Birthday Bash',
        caption: 'Weiteres Bild aus der aktuellen Repo-Galerie.',
      },
    ],
  },
];

export function resolveEventGallery(
  event: Pick<AdminEvent, 'slug' | 'title' | 'imageUrl'>,
): EventGallery {
  const localGallery = repoEventGalleryCatalog.find((entry) => entry.eventSlug === event.slug);

  if (localGallery?.images.length) {
    return {
      provider: 'repo-folder',
      folderPath: localGallery.folderPath,
      images: localGallery.images,
    };
  }

  const fallbackImage = event.imageUrl?.trim()
    ? [
        {
          src: event.imageUrl,
          alt: `Eventbild zu ${event.title}`,
          caption: 'Aktuell noch kein lokaler Galerieordner verknuepft.',
        },
      ]
    : [];

  return {
    provider: 'event-poster',
    folderPath: getExpectedEventGalleryFolder(event.slug),
    images: fallbackImage,
  };
}

export function getExpectedEventGalleryFolder(slug: string): string {
  return `${REPO_EVENT_GALLERY_ROOT}/${slug}`;
}
