export type ScrapedEvent = {
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

export type ScrapeSourceResult = {
  url: string;
  event?: ScrapedEvent;
  errors: string[];
  extractionChain: string[];
};

export type ScrapeEventsResponse = {
  events: ScrapedEvent[];
  results: ScrapeSourceResult[];
};

type FetchMethod = 'direct' | 'proxy';

type FetchResult = {
  method: FetchMethod;
  requestUrl: string;
  finalUrl: string;
  body: string;
  contentType: string;
};

type SourceConfig = {
  url: string;
  sourceLabel?: string;
  useTextProxy: boolean;
};

type ExtractedFields = {
  title?: string;
  description?: string;
  imageUrl?: string;
  startsAt?: string;
  venue?: string;
  address?: string;
  city?: string;
  organizer?: string;
  sourceLabel?: string;
  slug?: string;
  sourceUrl?: string;
};

type LocationValue = {
  name?: unknown;
  address?: unknown;
};

const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
const TEXT_PROXY_PREFIX = 'https://r.jina.ai/http://';
const PROXY_FIRST_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'instagram.com',
  'www.instagram.com',
]);
const EVENT_KEYWORDS = [
  'event',
  'veranstaltung',
  'jam',
  'session',
  'konzert',
  'show',
  'gig',
  'live',
  'punk',
  'band',
  'musik',
  'music',
  'ticket',
];
const MONTH_PATTERN =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch|z)?|apr(?:il)?|may|jun(?:e)?|' +
  'jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|' +
  'dec(?:ember)?|maerz|märz|januar|februar|april|mai|juni|juli|august|' +
  'september|oktober|november|dezember)';
const DATE_REGEX = new RegExp(
  String.raw`\b(?:\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?|${MONTH_PATTERN}\s+\d{1,2})\b`,
  'i',
);
const TIME_PATTERN = String.raw`\b\d{1,2}:\d{2}\s*(?:am|pm)?\b`;
const TIME_REGEX = new RegExp(TIME_PATTERN, 'i');
const FACEBOOK_EVENT_PATH_REGEX = /^\/(?:events)\/\d+\/?$/i;
const FACEBOOK_EVENT_DATETIME_REGEX = new RegExp(
  String.raw`\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b.*(?:${MONTH_PATTERN}|\d{1,2}[./-]\d{1,2}).*(?:20\d{2}).*${TIME_PATTERN}`,
  'i',
);
const ATTRIBUTE_REGEX =
  /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const HTML_ENTITY_REGEX = /&(#x?[0-9a-f]+|[a-z]+);/gi;
const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

export async function scrapeUrls(urls: string[]): Promise<ScrapeEventsResponse> {
  const normalizedUrls = uniqueStrings(
    urls.filter((url) => isHttpUrl(url)).map((url) => url.trim()),
  );
  const results: ScrapeSourceResult[] = [];

  for (const url of normalizedUrls) {
    results.push(await scrapeSource(createSourceConfig(url)));
  }

  return {
    events: results.flatMap((result) => (result.event ? [result.event] : [])),
    results,
  };
}

function createSourceConfig(url: string): SourceConfig {
  const hostname = getHostname(url);
  return {
    url,
    sourceLabel: hostname.includes('facebook.com') ? 'Facebook' : undefined,
    useTextProxy: isFacebookEventUrl(url),
  };
}

async function scrapeSource(config: SourceConfig): Promise<ScrapeSourceResult> {
  const merged: ExtractedFields = {};
  const errors: string[] = [];
  const extractionChain: string[] = [];

  for (const method of buildFetchOrder(config)) {
    try {
      const result = await fetchDocument(config.url, method);
      const extracted = extractFields(result, config);
      mergeFieldData(merged, extracted);
      extractionChain.push(method);
    } catch (error) {
      errors.push(`${method}: ${getErrorMessage(error, 'Abruf fehlgeschlagen.')}`);
    }
  }

  const hostname = getHostname(config.url);
  merged.slug = merged.slug ?? slugify(merged.title ?? hostname);
  merged.sourceUrl = config.url;
  merged.sourceLabel = merged.sourceLabel ?? config.sourceLabel ?? hostname;
  const event = buildEvent(merged);

  if (!event) {
    errors.push('Konnte kein vollstaendiges Event mit Titel, Beschreibung und Datum extrahieren.');
  }

  return {
    url: config.url,
    event,
    errors,
    extractionChain,
  };
}

async function fetchDocument(url: string, method: FetchMethod): Promise<FetchResult> {
  const requestUrl =
    method === 'direct' ? url : `${TEXT_PROXY_PREFIX}${url.replace(/^https?:\/\//i, '')}`;

  const response = await fetch(requestUrl, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return {
    method,
    requestUrl,
    finalUrl: response.url,
    body: await response.text(),
    contentType: normalizeContentType(response.headers.get('content-type')),
  };
}

function extractFields(result: FetchResult, config: SourceConfig): ExtractedFields {
  if (result.contentType === 'text/plain' || result.body.slice(0, 400).includes('Markdown Content:')) {
    return extractFromMarkdown(result, config);
  }

  return extractFromHtml(result, config);
}

function extractFromHtml(result: FetchResult, config: SourceConfig): ExtractedFields {
  const meta = extractMeta(result.body);
  const titleParts = extractTitleParts(result.body);
  const headings = extractTagTexts(result.body, ['h1', 'h2', 'h3']);
  const paragraphs = extractTagTexts(result.body, ['p', 'article']);
  const images = extractImageUrls(result.body, result.finalUrl);
  const timeValues = extractTimeValues(result.body);
  const jsonLdRaw = extractJsonLd(result.body);
  const jsonLdObjects = jsonLdRaw.flatMap((value) => normalizeJsonLd(parseJsonPayload(value)));
  const eventJson = findEventJsonLd(jsonLdObjects);

  const eventTitle =
    extractText(eventJson?.name) ??
    meta['og:title'] ??
    meta['twitter:title'] ??
    extractText(titleParts.join(' ')) ??
    headings[0];
  const description =
    extractText(eventJson?.description) ??
    meta['og:description'] ??
    meta.description ??
    meta['twitter:description'] ??
    paragraphs.find((paragraph) => paragraph.length > 40);
  const [venue, address, city] = normalizeLocation(eventJson?.location);
  const imageUrl =
    normalizeImage(eventJson?.image, result.finalUrl) ??
    normalizeImage(meta['og:image'], result.finalUrl) ??
    normalizeImage(meta['twitter:image'], result.finalUrl) ??
    images[0];
  const startsAt =
    extractText(eventJson?.startDate) ??
    meta['event:start_time'] ??
    timeValues[0];
  const organizer =
    eventJson && typeof eventJson.organizer === 'object' && eventJson.organizer !== null
      ? extractText((eventJson.organizer as Record<string, unknown>).name)
      : undefined;

  return {
    title: eventTitle,
    description,
    imageUrl,
    startsAt,
    venue,
    address,
    city,
    organizer,
    sourceLabel: config.sourceLabel ?? organizer,
  };
}

function extractFromMarkdown(result: FetchResult, config: SourceConfig): ExtractedFields {
  if (isFacebookEventUrl(config.url)) {
    return extractFromFacebookEventMarkdown(result, config);
  }

  const lines = result.body.split('\n').map((line) => line.replace(/\r$/, ''));
  const candidateTexts: string[] = [];
  const imageCandidates: Array<{ altText: string; url: string }> = [];

  let title: string | undefined;
  let description: string | undefined;
  let imageUrl: string | undefined;
  let sourceLabel = config.sourceLabel;
  let startsAt: string | undefined;

  lines.forEach((line, index) => {
    const stripped = line.trim();
    const cleaned = cleanMarkdownText(stripped) ?? '';

    if (stripped.startsWith('Title:') && !title) {
      title = extractText(stripped.slice(6));
      return;
    }

    if (stripped.startsWith('# ') && !title) {
      title = extractText(stripped.slice(2));
      return;
    }

    if (!sourceLabel && stripped.startsWith('URL Source:')) {
      sourceLabel = getHostname(stripped.slice(11).trim());
      return;
    }

    if (!startsAt && DATE_REGEX.test(cleaned)) {
      startsAt = cleaned;
    }

    if (stripped.startsWith('![') && stripped.includes('](')) {
      const image = extractMarkdownImage(stripped);
      if (image && !image.url.startsWith('blob:')) {
        imageCandidates.push(image);
        if (looksLikeEventText(image.altText)) {
          candidateTexts.push(image.altText);
        }
      }
      return;
    }

    if (stripped.startsWith('[') && stripped.includes('](')) {
      return;
    }

    if (cleaned.length > 25) {
      candidateTexts.push(cleaned);
    }

    if (!description && cleaned.length > 40 && looksLikeEventText(cleaned)) {
      description = cleaned;
    }

    if (!description && startsAt && index > 0 && cleaned.length > 40) {
      description = cleaned;
    }
  });

  if (imageCandidates.length) {
    imageCandidates.sort((left, right) => {
      const leftPriority = looksLikeEventText(left.altText) ? 0 : 1;
      const rightPriority = looksLikeEventText(right.altText) ? 0 : 1;
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.altText.length - right.altText.length;
    });
    imageUrl = imageCandidates[0]?.url;
  }

  title ??=
    candidateTexts.find((text) => looksLikeEventText(text) && text.length < 120) ?? undefined;
  description ??= candidateTexts.find((text) => text.length > 50) ?? undefined;

  return {
    title,
    description,
    imageUrl,
    startsAt,
    sourceLabel,
  };
}

function extractFromFacebookEventMarkdown(
  result: FetchResult,
  config: SourceConfig,
): ExtractedFields {
  const lines = result.body.split('\n').map((line) => line.replace(/\r$/, ''));
  const cleanedLines = lines.map((line) => cleanMarkdownText(line) ?? '');

  let siteTitle: string | undefined;
  let title: string | undefined;
  let titleIndex: number | undefined;
  let startsAt: string | undefined;
  let startsIndex: number | undefined;
  let venue: string | undefined;
  let organizer: string | undefined;
  let address: string | undefined;
  let city: string | undefined;
  let imageUrl: string | undefined;

  const descriptionLines: string[] = [];

  lines.forEach((line, index) => {
    const stripped = line.trim();
    const cleaned = cleanedLines[index] ?? '';

    if (stripped.startsWith('Title:') && !siteTitle) {
      siteTitle = stripFacebookSuffix(stripped.slice(6));
      return;
    }

    if (!title && siteTitle && cleaned === siteTitle) {
      title = siteTitle;
      titleIndex = index;
      return;
    }

    if (!startsAt && looksLikeDateTimeText(cleaned)) {
      startsAt = cleaned;
      startsIndex = index;
      return;
    }

    if (
      !organizer &&
      /^(event by |veranstaltung von )/i.test(cleaned)
    ) {
      organizer = cleaned.replace(/^(event by |veranstaltung von )/i, '').trim();
    }
  });

  title ??= siteTitle;

  if (titleIndex === undefined && title) {
    titleIndex = cleanedLines.findIndex((value) => value === title);
    if (titleIndex < 0) {
      titleIndex = undefined;
    }
  }

  const referenceIndex = titleIndex ?? startsIndex;
  if (referenceIndex !== undefined) {
    for (let index = referenceIndex - 1; index >= 0; index -= 1) {
      const image = extractMarkdownImage(lines[index] ?? '');
      if (!image?.url || image.url.startsWith('blob:') || !image.url.includes('scontent')) {
        continue;
      }
      imageUrl = image.url;
      break;
    }
  }

  if (titleIndex !== undefined) {
    for (let offset = 1; offset <= 3; offset += 1) {
      const candidate = cleanedLines[titleIndex + offset] ?? '';
      if (!candidate || looksLikeSectionLabel(candidate) || candidate === startsAt) {
        continue;
      }
      if (/^(about|discussion|more)$/i.test(candidate)) {
        continue;
      }
      venue = candidate;
      break;
    }
  }

  let descriptionStart: number | undefined;
  cleanedLines.forEach((cleaned, index) => {
    const lowered = cleaned.toLowerCase();
    if (
      descriptionStart === undefined &&
      (lowered.includes('anyone on or off facebook') ||
        lowered.startsWith('public ·') ||
        lowered.includes('auf oder außerhalb von facebook'))
    ) {
      descriptionStart = index + 1;
    }
  });

  if (descriptionStart !== undefined) {
    for (let index = descriptionStart; index < lines.length; index += 1) {
      const stripped = lines[index]?.trim() ?? '';
      const cleaned = cleanedLines[index] ?? '';
      if (!cleaned) {
        continue;
      }
      if (
        /^(see more on facebook|email or phone number|password)/i.test(cleaned) ||
        cleaned === 'See more' ||
        cleaned === 'Details' ||
        cleaned === 'Host' ||
        cleaned.startsWith('## ') ||
        cleaned.toLowerCase() === 'suggested events'
      ) {
        break;
      }
      if (cleaned.toLowerCase().startsWith('viechtach') && descriptionLines.length) {
        break;
      }
      const linkLabel = extractLinkLabel(stripped);
      if (linkLabel && descriptionLines.length) {
        address = linkLabel;
        break;
      }
      if (stripped.startsWith('![') || looksLikeSectionLabel(cleaned)) {
        break;
      }
      descriptionLines.push(cleaned);
    }
  }

  if (!address) {
    address =
      cleanedLines.find((cleaned) => Boolean(venue && cleaned.startsWith(venue) && cleaned.includes(','))) ??
      undefined;
  }

  city ??= parseCityFromAddress(address);

  return {
    title,
    description: extractText(descriptionLines.join(' ')),
    imageUrl,
    startsAt,
    venue,
    address,
    city,
    organizer,
    sourceLabel: config.sourceLabel ?? 'Facebook',
  };
}

function mergeFieldData(target: ExtractedFields, incoming: ExtractedFields): void {
  const entries = Object.entries(incoming) as Array<[keyof ExtractedFields, string | undefined]>;
  for (const [key, value] of entries) {
    if (!target[key] && value) {
      target[key] = value;
    }
  }
}

function buildFetchOrder(config: SourceConfig): FetchMethod[] {
  return config.useTextProxy ? ['proxy', 'direct'] : ['direct', 'proxy'];
}

function buildEvent(fields: ExtractedFields): ScrapedEvent | undefined {
  if (!fields.title || !fields.description || !fields.startsAt || !fields.slug) {
    return undefined;
  }

  return {
    title: fields.title,
    description: fields.description,
    imageUrl: fields.imageUrl ?? '/logo.jpg',
    startsAt: fields.startsAt,
    venue: fields.venue,
    address: fields.address,
    city: fields.city,
    organizer: fields.organizer,
    sourceLabel: fields.sourceLabel,
    slug: fields.slug,
    sourceUrl: fields.sourceUrl,
  };
}

function extractMeta(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const regex = /<meta\b([^>]*?)>/gi;
  for (const match of html.matchAll(regex)) {
    const attrs = parseAttributes(match[1] ?? '');
    const key =
      attrs.property ?? attrs.name ?? attrs.itemprop ?? attrs['http-equiv'];
    const content = extractText(attrs.content);
    if (key && content) {
      meta[key.toLowerCase()] = content;
    }
  }
  return meta;
}

function extractTitleParts(html: string): string[] {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const title = extractText(stripTags(match?.[1] ?? ''));
  return title ? [title] : [];
}

function extractTagTexts(html: string, tags: string[]): string[] {
  const regex = new RegExp(`<(${tags.join('|')})\\b[^>]*>([\\s\\S]*?)<\\/\\1>`, 'gi');
  const texts: string[] = [];

  for (const match of html.matchAll(regex)) {
    const text = extractText(stripTags(match[2] ?? ''));
    if (text) {
      texts.push(text);
    }
  }

  return uniqueStrings(texts);
}

function extractImageUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const regex = /<img\b([^>]*?)>/gi;

  for (const match of html.matchAll(regex)) {
    const attrs = parseAttributes(match[1] ?? '');
    const candidate = attrs.src ?? attrs['data-src'];
    const imageUrl = normalizeImage(candidate, baseUrl);
    if (imageUrl) {
      urls.push(imageUrl);
    }
  }

  return uniqueStrings(urls);
}

function extractTimeValues(html: string): string[] {
  const regex = /<time\b([^>]*?)>([\s\S]*?)<\/time>/gi;
  const values: string[] = [];

  for (const match of html.matchAll(regex)) {
    const attrs = parseAttributes(match[1] ?? '');
    const dateTimeValue = extractText(attrs.datetime);
    const textValue = extractText(stripTags(match[2] ?? ''));
    if (dateTimeValue) {
      values.push(dateTimeValue);
    }
    if (textValue) {
      values.push(textValue);
    }
  }

  return uniqueStrings(values);
}

function extractJsonLd(html: string): string[] {
  const regex = /<script\b([^>]*?)>([\s\S]*?)<\/script>/gi;
  const values: string[] = [];

  for (const match of html.matchAll(regex)) {
    const attrs = parseAttributes(match[1] ?? '');
    if (extractText(attrs.type)?.toLowerCase() !== 'application/ld+json') {
      continue;
    }
    const rawValue = (match[2] ?? '').trim();
    if (rawValue) {
      values.push(rawValue);
    }
  }

  return values;
}

function parseAttributes(rawAttributes: string): Record<string, string> {
  const attributes: Record<string, string> = {};

  for (const match of rawAttributes.matchAll(ATTRIBUTE_REGEX)) {
    const key = (match[1] ?? '').toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    if (key) {
      attributes[key] = decodeHtmlEntities(value);
    }
  }

  return attributes;
}

function parseJsonPayload(rawValue: string): unknown {
  const candidates = [
    rawValue.trim(),
    rawValue.trim().replace(/^<!--|-->$/g, '').trim(),
    rawValue.trim().replace(/^<!\[CDATA\[|\]\]>$/g, '').trim(),
  ];

  for (const candidate of uniqueStrings(candidates)) {
    if (!candidate) {
      continue;
    }

    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return undefined;
}

function normalizeJsonLd(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeJsonLd(item));
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  const item = value as Record<string, unknown>;
  const graph = Array.isArray(item['@graph']) ? normalizeJsonLd(item['@graph']) : [];
  return [item, ...graph];
}

function findEventJsonLd(
  objects: Array<Record<string, unknown>>,
): Record<string, unknown> | undefined {
  return objects.find((item) => isEventType(item['@type']));
}

function isEventType(typeValue: unknown): boolean {
  if (Array.isArray(typeValue)) {
    return typeValue.some((value) => isEventType(value));
  }

  return typeof typeValue === 'string' && typeValue.toLowerCase() === 'event';
}

function normalizeLocation(value: unknown): [string?, string?, string?] {
  if (Array.isArray(value)) {
    for (const item of value) {
      const location = normalizeLocation(item);
      if (location[0] || location[1] || location[2]) {
        return location;
      }
    }
    return [];
  }

  if (!value || typeof value !== 'object') {
    const venue = extractText(value);
    return venue ? [venue] : [];
  }

  const location = value as LocationValue;
  const venue = extractText(location.name);
  const addressValue = location.address;

  if (!addressValue || typeof addressValue !== 'object') {
    const address = extractText(addressValue);
    return [venue, address];
  }

  const address = addressValue as Record<string, unknown>;
  const city = extractText(address.addressLocality);
  const addressText = [
    extractText(address.streetAddress),
    extractText(address.postalCode),
    city,
    extractText(address.addressCountry),
  ]
    .filter(Boolean)
    .join(', ');

  return [venue, addressText || undefined, city];
}

function normalizeImage(value: unknown, baseUrl: string): string | undefined {
  if (Array.isArray(value)) {
    for (const item of value) {
      const imageUrl = normalizeImage(item, baseUrl);
      if (imageUrl) {
        return imageUrl;
      }
    }
    return undefined;
  }

  if (value && typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    return normalizeImage(
      candidate.url ?? candidate.contentUrl ?? candidate.thumbnailUrl ?? candidate['@id'],
      baseUrl,
    );
  }

  const text = extractText(value);
  if (!text || text.startsWith('blob:')) {
    return undefined;
  }

  try {
    return new URL(text, baseUrl).toString();
  } catch {
    return undefined;
  }
}

function isFacebookEventUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    return PROXY_FIRST_HOSTS.has(hostname) && FACEBOOK_EVENT_PATH_REGEX.test(parsedUrl.pathname);
  } catch {
    return false;
  }
}

function stripFacebookSuffix(value: unknown): string | undefined {
  const text = extractText(value);
  return text?.replace(/\s*\|\s*Facebook\s*$/i, '').trim() || undefined;
}

function looksLikeSectionLabel(value: string): boolean {
  return [
    'about',
    'discussion',
    'more',
    'details',
    'host',
    'suggested events',
    'see more',
    'invite',
    'events',
  ].includes(value.toLowerCase());
}

function parseCityFromAddress(value: unknown): string | undefined {
  const text = extractText(value);
  if (!text) {
    return undefined;
  }
  const parts = text.split(',').map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 ? parts.at(-2) : undefined;
}

function extractMarkdownImage(
  line: string,
): { altText: string; url: string } | undefined {
  const match = line.match(/!\[(.*?)\]\((.*?)\)/);
  const altText = cleanMarkdownText(match?.[1] ?? '');
  const url = extractText(match?.[2]);
  if (!match || !altText || !url) {
    return undefined;
  }
  return { altText, url };
}

function extractLinkLabel(line: string): string | undefined {
  const match = line.trim().match(/^\[(.*?)\]\((.*?)\)$/);
  return match ? cleanMarkdownText(match[1]) : undefined;
}

function looksLikeEventText(value: string): boolean {
  const lowered = value.toLowerCase();
  return EVENT_KEYWORDS.some((keyword) => lowered.includes(keyword)) || DATE_REGEX.test(value);
}

function looksLikeDateTimeText(value: string): boolean {
  const lowered = value.toLowerCase();
  if (!TIME_REGEX.test(value) || !/\b20\d{2}\b/.test(value)) {
    return false;
  }
  return (
    FACEBOOK_EVENT_DATETIME_REGEX.test(value) ||
    [' at ', ' um ', ' cet', ' cest', ' utc'].some((token) => lowered.includes(token))
  );
}

function cleanMarkdownText(value: string): string | undefined {
  return extractText(
    value
      .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/^#+\s*/, '')
      .replace(/[*_`]+/g, ''),
  );
}

function slugify(value: string): string {
  return (
    extractText(value)
      ?.toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'event'
  );
}

function extractText(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const text = decodeHtmlEntities(String(value)).replace(/\s+/g, ' ').trim();
  return text || undefined;
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ');
}

function decodeHtmlEntities(value: string): string {
  return value.replace(HTML_ENTITY_REGEX, (_match, entity: string) => {
    const lowered = entity.toLowerCase();
    if (lowered.startsWith('#x')) {
      return String.fromCodePoint(Number.parseInt(lowered.slice(2), 16));
    }
    if (lowered.startsWith('#')) {
      return String.fromCodePoint(Number.parseInt(lowered.slice(1), 10));
    }
    return HTML_ENTITIES[lowered] ?? `&${entity};`;
  });
}

function normalizeContentType(value: string | null): string {
  return value?.split(';')[0]?.trim().toLowerCase() ?? 'text/html';
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }

  return result;
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname || 'Quelle';
  } catch {
    return 'Quelle';
  }
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return fallback;
}
