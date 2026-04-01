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

export function parseEventDate(value: string | undefined): Date | null {
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
    /^([A-Za-zäöüÄÖÜ]+)\s+(\d{1,2}),?\s*(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i,
  );

  if (englishMatch) {
    const [, monthName, dayValue, yearValue, hourValue, minuteValue, meridiem] = englishMatch;
    return buildDate(yearValue, monthName, dayValue, hourValue, minuteValue, meridiem);
  }

  const germanMatch = candidate.match(
    /^(\d{1,2})\.\s*([A-Za-zäöüÄÖÜ]+)\s*(\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?$/i,
  );

  if (germanMatch) {
    const [, dayValue, monthName, yearValue, hourValue, minuteValue, meridiem] = germanMatch;
    return buildDate(yearValue, monthName, dayValue, hourValue, minuteValue, meridiem);
  }

  const isoMatch = candidate.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2}))?$/,
  );

  if (isoMatch) {
    const [, yearValue, monthValue, dayValue, hourValue, minuteValue] = isoMatch;
    return buildNumericDate(yearValue, monthValue, dayValue, hourValue, minuteValue);
  }

  const numericMatch = candidate.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:[,\sT]+(\d{1,2}):(\d{2}))?$/,
  );

  if (numericMatch) {
    const [, dayValue, monthValue, yearValue, hourValue, minuteValue] = numericMatch;
    const normalizedYear = yearValue.length === 2 ? `20${yearValue}` : yearValue;
    return buildNumericDate(normalizedYear, monthValue, dayValue, hourValue, minuteValue);
  }

  const fallback = new Date(candidate);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function buildDate(
  yearValue: string,
  monthName: string,
  dayValue: string,
  hourValue?: string,
  minuteValue?: string,
  meridiem?: string,
): Date | null {
  const normalizedMonth = monthName.toLowerCase().replace(/\.$/, '');
  const monthIndex = MONTHS.get(normalizedMonth);

  if (monthIndex === undefined) {
    return null;
  }

  const { hour, minute } = parseTime(hourValue, minuteValue, meridiem);

  return new Date(Number(yearValue), monthIndex, Number(dayValue), hour, minute);
}

function buildNumericDate(
  yearValue: string,
  monthValue: string,
  dayValue: string,
  hourValue?: string,
  minuteValue?: string,
): Date {
  const { hour, minute } = parseTime(hourValue, minuteValue);

  return new Date(
    Number(yearValue),
    Number(monthValue) - 1,
    Number(dayValue),
    hour,
    minute,
  );
}

function parseTime(
  hourValue?: string,
  minuteValue?: string,
  meridiem?: string,
): { hour: number; minute: number } {
  if (hourValue === undefined || minuteValue === undefined) {
    return {
      hour: 23,
      minute: 59,
    };
  }

  let hour = Number(hourValue);
  if (meridiem?.toUpperCase() === 'PM' && hour < 12) {
    hour += 12;
  }
  if (meridiem?.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  return {
    hour,
    minute: Number(minuteValue),
  };
}
