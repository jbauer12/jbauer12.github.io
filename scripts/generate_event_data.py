#!/usr/bin/env python3
"""Generate normalized event data from a list of source URLs."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


DEFAULT_INPUT = Path("data/event-sources.json")
DEFAULT_OUTPUT = Path("public/events.generated.json")
USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
)
TEXT_PROXY_PREFIX = "https://r.jina.ai/http://"
PROXY_FIRST_HOSTS = {
    "facebook.com",
    "www.facebook.com",
    "m.facebook.com",
    "instagram.com",
    "www.instagram.com",
}
EVENT_KEYWORDS = (
    "event",
    "veranstaltung",
    "jam",
    "session",
    "konzert",
    "show",
    "gig",
    "live",
    "punk",
    "band",
    "musik",
    "music",
    "ticket",
)
MONTH_PATTERN = (
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch|z)?|apr(?:il)?|may|jun(?:e)?|"
    r"jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|"
    r"dec(?:ember)?|maerz|märz|januar|februar|april|mai|juni|juli|august|"
    r"september|oktober|november|dezember)"
)
DATE_REGEX = re.compile(
    rf"(?ix)\b(?:\d{{1,2}}[./-]\d{{1,2}}(?:[./-]\d{{2,4}})?|{MONTH_PATTERN}\s+\d{{1,2}})\b"
)
TIME_PATTERN = r"\b\d{1,2}:\d{2}\s*(?:am|pm)?\b"
TIME_REGEX = re.compile(TIME_PATTERN, re.IGNORECASE)
FACEBOOK_EVENT_PATH_REGEX = re.compile(r"(?i)^/(?:events)/\d+/?$")
FACEBOOK_EVENT_DATETIME_REGEX = re.compile(
    rf"(?ix)\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|"
    rf"montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b.*"
    rf"(?:{MONTH_PATTERN}|\d{{1,2}}[./-]\d{{1,2}}).*"
    rf"(?:20\d{{2}}).*"
    rf"{TIME_PATTERN}"
)


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        value = str(value)
    text = unescape(value)
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def clean_markdown_text(value: str) -> str | None:
    value = re.sub(r"!\[(.*?)\]\((.*?)\)", r"\1", value)
    value = re.sub(r"\[(.*?)\]\((.*?)\)", r"\1", value)
    value = re.sub(r"^#+\s*", "", value)
    value = re.sub(r"[*_`]+", "", value)
    return clean_text(value)


def slugify(value: str) -> str:
    value = clean_text(value) or "event"
    value = value.lower()
    replacements = {
        "ä": "ae",
        "ö": "oe",
        "ü": "ue",
        "ß": "ss",
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
    value = re.sub(r"[^a-z0-9]+", "-", value).strip("-")
    return value or "event"


def first_non_empty(*values: Any) -> Any:
    for value in values:
        if value is None:
            continue
        if isinstance(value, str):
            candidate = clean_text(value)
            if candidate:
                return candidate
            continue
        if isinstance(value, list) and value:
            return value
        if isinstance(value, dict) and value:
            return value
        if value:
            return value
    return None


def unique_list(values: list[Any]) -> list[Any]:
    seen: set[Any] = set()
    result: list[Any] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def parse_json_payload(raw_value: str) -> Any:
    raw_value = raw_value.strip()
    if not raw_value:
        return None

    candidates = [raw_value]
    if raw_value.startswith(("<!--", "<![CDATA[")):
        candidates.append(re.sub(r"^<!--|-->$|^<!\[CDATA\[|\]\]>$", "", raw_value).strip())

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    return None


def normalize_json_ld(value: Any) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []

    if isinstance(value, list):
        for item in value:
            items.extend(normalize_json_ld(item))
        return items

    if not isinstance(value, dict):
        return items

    items.append(value)

    graph = value.get("@graph")
    if isinstance(graph, list):
        for item in graph:
            items.extend(normalize_json_ld(item))

    return items


def is_event_type(type_value: Any) -> bool:
    if isinstance(type_value, list):
        return any(is_event_type(item) for item in type_value)
    if not isinstance(type_value, str):
        return False
    return type_value.lower() == "event"


def find_event_json_ld(objects: list[dict[str, Any]]) -> dict[str, Any] | None:
    for obj in objects:
        if is_event_type(obj.get("@type")):
            return obj
    return None


def normalize_image(value: Any, base_url: str) -> str | None:
    if isinstance(value, list):
        for item in value:
            candidate = normalize_image(item, base_url)
            if candidate:
                return candidate
        return None

    if isinstance(value, dict):
        return normalize_image(
            value.get("url")
            or value.get("contentUrl")
            or value.get("thumbnailUrl")
            or value.get("@id"),
            base_url,
        )

    if not isinstance(value, str):
        return None

    candidate = clean_text(value)
    if not candidate:
        return None
    if candidate.startswith("blob:"):
        return None
    return urljoin(base_url, candidate)


def normalize_location(location: Any) -> tuple[str | None, str | None, str | None]:
    if isinstance(location, list):
        for item in location:
            venue, address, city = normalize_location(item)
            if venue or address or city:
                return venue, address, city
        return None, None, None

    if not isinstance(location, dict):
        return clean_text(location), None, None

    venue = clean_text(location.get("name"))
    address_value = location.get("address")
    city = None
    address = None

    if isinstance(address_value, dict):
        address_parts = [
            clean_text(address_value.get("streetAddress")),
            clean_text(address_value.get("postalCode")),
            clean_text(address_value.get("addressLocality")),
            clean_text(address_value.get("addressCountry")),
        ]
        city = clean_text(address_value.get("addressLocality"))
        address = ", ".join(part for part in address_parts if part)
    else:
        address = clean_text(address_value)

    return venue, address, city


def looks_like_event_text(value: str) -> bool:
    lowered = value.lower()
    return any(keyword in lowered for keyword in EVENT_KEYWORDS) or bool(DATE_REGEX.search(value))


def looks_like_datetime_text(value: str) -> bool:
    lowered = value.lower()
    if not TIME_REGEX.search(value):
        return False
    if not re.search(r"\b20\d{2}\b", value):
        return False
    if FACEBOOK_EVENT_DATETIME_REGEX.search(value):
        return True
    return any(token in lowered for token in (" at ", " um ", " cet", " cest", " utc"))


def is_facebook_event_url(url: str) -> bool:
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    if hostname not in PROXY_FIRST_HOSTS:
        return False
    return bool(FACEBOOK_EVENT_PATH_REGEX.match(parsed.path or ""))


def strip_facebook_suffix(value: str | None) -> str | None:
    text = clean_text(value)
    if not text:
        return None
    text = re.sub(r"\s*\|\s*Facebook\s*$", "", text, flags=re.IGNORECASE)
    return clean_text(text)


def looks_like_section_label(value: str) -> bool:
    lowered = value.lower()
    return lowered in {
        "about",
        "discussion",
        "more",
        "details",
        "host",
        "suggested events",
        "see more",
        "invite",
        "events",
    }


def parse_city_from_address(value: str | None) -> str | None:
    text = clean_text(value)
    if not text:
        return None
    parts = [part.strip() for part in text.split(",") if part.strip()]
    if len(parts) >= 2:
        return parts[-2]
    return None


def extract_markdown_image(line: str) -> tuple[str | None, str | None]:
    match = re.search(r"!\[(.*?)\]\((.*?)\)", line)
    if not match:
        return None, None
    alt_text = clean_markdown_text(match.group(1))
    url = clean_text(match.group(2))
    return alt_text, url


def extract_link_label(line: str) -> str | None:
    match = re.search(r"^\[(.*?)\]\((.*?)\)$", line.strip())
    if not match:
        return None
    return clean_markdown_text(match.group(1))


class MetadataHTMLParser(HTMLParser):
    def __init__(self, base_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.meta: dict[str, str] = {}
        self.title_parts: list[str] = []
        self.headings: list[str] = []
        self.paragraphs: list[str] = []
        self.images: list[str] = []
        self.time_values: list[str] = []
        self.json_ld_raw: list[str] = []

        self._capture_title = False
        self._capture_json_ld = False
        self._current_heading = False
        self._current_paragraph = False
        self._buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {key.lower(): value for key, value in attrs}
        tag = tag.lower()

        if tag == "meta":
            key = (
                attrs_dict.get("property")
                or attrs_dict.get("name")
                or attrs_dict.get("itemprop")
                or attrs_dict.get("http-equiv")
            )
            content = attrs_dict.get("content")
            if key and content:
                self.meta[key.lower()] = clean_text(content) or content
            return

        if tag == "title":
            self._capture_title = True
            self._buffer = []
            return

        if tag in {"h1", "h2", "h3"}:
            self._current_heading = True
            self._buffer = []
            return

        if tag in {"p", "article"}:
            self._current_paragraph = True
            self._buffer = []
            return

        if tag == "time":
            datetime_value = clean_text(attrs_dict.get("datetime"))
            if datetime_value:
                self.time_values.append(datetime_value)
            self._current_paragraph = True
            self._buffer = []
            return

        if tag == "img":
            source = attrs_dict.get("src") or attrs_dict.get("data-src")
            if source:
                self.images.append(urljoin(self.base_url, source))
            return

        if tag == "script" and clean_text(attrs_dict.get("type")) == "application/ld+json":
            self._capture_json_ld = True
            self._buffer = []

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag == "title" and self._capture_title:
            self.title_parts.extend(self._buffer)
            self._capture_title = False
            self._buffer = []
            return

        if tag in {"h1", "h2", "h3"} and self._current_heading:
            text = clean_text(" ".join(self._buffer))
            if text:
                self.headings.append(text)
            self._current_heading = False
            self._buffer = []
            return

        if tag in {"p", "article", "time"} and self._current_paragraph:
            text = clean_text(" ".join(self._buffer))
            if text:
                self.paragraphs.append(text)
            self._current_paragraph = False
            self._buffer = []
            return

        if tag == "script" and self._capture_json_ld:
            raw_value = "".join(self._buffer).strip()
            if raw_value:
                self.json_ld_raw.append(raw_value)
            self._capture_json_ld = False
            self._buffer = []

    def handle_data(self, data: str) -> None:
        if not data.strip():
            return
        if self._capture_title or self._current_heading or self._current_paragraph or self._capture_json_ld:
            self._buffer.append(data)


@dataclass
class SourceConfig:
    url: str
    slug: str | None = None
    source_label: str | None = None
    tags: list[str] = field(default_factory=list)
    overrides: dict[str, Any] = field(default_factory=dict)
    use_text_proxy: bool = False
    disabled: bool = False


@dataclass
class FetchResult:
    method: str
    request_url: str
    final_url: str
    body: str
    content_type: str


def load_source_configs(path: Path) -> list[SourceConfig]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    raw_events: list[dict[str, Any]]

    if isinstance(payload, list):
        raw_events = payload
    elif isinstance(payload, dict) and isinstance(payload.get("events"), list):
        raw_events = payload["events"]
    else:
        raise ValueError("Input JSON must be an array or an object with an 'events' array.")

    configs: list[SourceConfig] = []
    for raw_item in raw_events:
        if isinstance(raw_item, str):
            url = clean_text(raw_item)
            if not url:
                continue
            configs.append(
                SourceConfig(
                    url=url,
                    source_label="Facebook" if "facebook.com" in url else None,
                    use_text_proxy=is_facebook_event_url(url),
                )
            )
            continue

        if not isinstance(raw_item, dict) or not clean_text(raw_item.get("url")):
            continue

        config = SourceConfig(
            url=clean_text(raw_item["url"]) or "",
            slug=clean_text(raw_item.get("slug")),
            source_label=clean_text(raw_item.get("sourceLabel")),
            tags=[clean_text(tag) for tag in raw_item.get("tags", []) if clean_text(tag)],
            overrides=raw_item.get("overrides", {}) if isinstance(raw_item.get("overrides"), dict) else {},
            use_text_proxy=bool(raw_item.get("useTextProxy")),
            disabled=bool(raw_item.get("disabled")),
        )
        if not config.disabled:
            configs.append(config)

    return configs


def fetch_document(url: str, method: str, timeout: float) -> FetchResult:
    request_url = url if method == "direct" else f"{TEXT_PROXY_PREFIX}{url}"
    request = Request(
        request_url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        },
    )

    with urlopen(request, timeout=timeout) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        body = response.read().decode(charset, errors="replace")
        content_type = response.headers.get_content_type()
        final_url = response.geturl()

    return FetchResult(
        method=method,
        request_url=request_url,
        final_url=final_url,
        body=body,
        content_type=content_type,
    )


def extract_from_html(result: FetchResult, config: SourceConfig) -> dict[str, Any]:
    parser = MetadataHTMLParser(result.final_url)
    parser.feed(result.body)

    json_ld_objects: list[dict[str, Any]] = []
    for raw_value in parser.json_ld_raw:
        payload = parse_json_payload(raw_value)
        if payload is not None:
            json_ld_objects.extend(normalize_json_ld(payload))

    event_json = find_event_json_ld(json_ld_objects)
    meta = parser.meta

    title = first_non_empty(
        clean_text(event_json.get("name")) if event_json else None,
        meta.get("og:title"),
        meta.get("twitter:title"),
        clean_text(" ".join(parser.title_parts)),
        parser.headings[0] if parser.headings else None,
    )

    description = first_non_empty(
        clean_text(event_json.get("description")) if event_json else None,
        meta.get("og:description"),
        meta.get("description"),
        meta.get("twitter:description"),
        next((paragraph for paragraph in parser.paragraphs if len(paragraph) > 40), None),
    )

    venue, address, city = normalize_location(event_json.get("location")) if event_json else (None, None, None)
    image_url = first_non_empty(
        normalize_image(event_json.get("image"), result.final_url) if event_json else None,
        normalize_image(meta.get("og:image"), result.final_url),
        normalize_image(meta.get("twitter:image"), result.final_url),
        parser.images[0] if parser.images else None,
    )

    starts_at = first_non_empty(
        clean_text(event_json.get("startDate")) if event_json else None,
        meta.get("event:start_time"),
        parser.time_values[0] if parser.time_values else None,
    )
    ends_at = first_non_empty(
        clean_text(event_json.get("endDate")) if event_json else None,
        meta.get("event:end_time"),
    )

    organizer = event_json.get("organizer") if event_json else None
    source_name = clean_text(organizer.get("name")) if isinstance(organizer, dict) else None

    return {
        "title": title,
        "description": description,
        "imageUrl": image_url,
        "startsAt": starts_at,
        "endsAt": ends_at,
        "venue": venue,
        "address": address,
        "city": city,
        "sourceLabel": first_non_empty(config.source_label, source_name),
        "_extractionMethod": result.method,
    }


def extract_from_facebook_event_markdown(result: FetchResult, config: SourceConfig) -> dict[str, Any]:
    lines = [line.rstrip() for line in result.body.splitlines()]
    cleaned_lines = [clean_markdown_text(line) or "" for line in lines]

    site_title = None
    title = None
    title_index = None
    starts_at = None
    starts_index = None
    venue = None
    organizer = None
    address = None
    city = None
    description_lines: list[str] = []
    image_url = None

    for index, line in enumerate(lines):
        stripped = line.strip()
        cleaned = cleaned_lines[index]

        if stripped.startswith("Title:") and site_title is None:
            site_title = strip_facebook_suffix(stripped.removeprefix("Title:"))
            continue

        if title is None and site_title and cleaned == site_title:
            title = site_title
            title_index = index
            continue

        if starts_at is None and looks_like_datetime_text(cleaned):
            starts_at = cleaned
            starts_index = index
            continue

        if organizer is None and cleaned.lower().startswith(("event by ", "veranstaltung von ")):
            organizer = re.sub(r"(?i)^(event by|veranstaltung von)\s+", "", cleaned).strip()

    if title is None and site_title:
        title = site_title

    if title_index is None and title:
        for index, cleaned in enumerate(cleaned_lines):
            if cleaned == title:
                title_index = index
                break

    reference_index = title_index if title_index is not None else starts_index

    if reference_index is not None:
        for index in range(reference_index - 1, -1, -1):
            _alt_text, candidate_url = extract_markdown_image(lines[index])
            if not candidate_url or candidate_url.startswith("blob:"):
                continue
            if "scontent" not in candidate_url:
                continue
            image_url = candidate_url
            break

    if title_index is not None:
        for offset in range(1, 4):
            next_index = title_index + offset
            if next_index >= len(cleaned_lines):
                break
            candidate = cleaned_lines[next_index]
            if not candidate or looks_like_section_label(candidate):
                continue
            if candidate == starts_at:
                continue
            if candidate.lower().startswith(("about", "discussion", "more")):
                continue
            venue = candidate
            break

    description_start = None
    for index, cleaned in enumerate(cleaned_lines):
        lowered = cleaned.lower()
        if "anyone on or off facebook" in lowered or lowered.startswith("public ·") or "auf oder außerhalb von facebook" in lowered:
            description_start = index + 1
            break

    if description_start is not None:
        for index in range(description_start, len(lines)):
            stripped = lines[index].strip()
            cleaned = cleaned_lines[index]
            if not cleaned:
                continue
            if cleaned.lower().startswith(("see more on facebook", "email or phone number", "password")):
                break
            if cleaned in {"See more", "Details", "Host"} or cleaned.startswith("## ") or cleaned.lower() in {"suggested events"}:
                break
            if cleaned.lower().startswith("viechtach") and description_lines:
                break
            link_label = extract_link_label(stripped)
            if link_label and description_lines:
                address = link_label
                break
            if stripped.startswith("!["):
                continue
            if looks_like_section_label(cleaned):
                break
            description_lines.append(cleaned)

    if address is None:
        for cleaned in cleaned_lines:
            if venue and cleaned.startswith(venue) and "," in cleaned:
                address = cleaned
                break

    if city is None:
        city = parse_city_from_address(address)

    description = clean_text(" ".join(description_lines))

    return {
        "title": title,
        "description": description,
        "imageUrl": image_url,
        "startsAt": starts_at,
        "venue": venue,
        "address": address,
        "city": city,
        "organizer": organizer,
        "sourceLabel": first_non_empty(config.source_label, "Facebook"),
        "_extractionMethod": result.method,
    }


def extract_from_markdown(result: FetchResult, config: SourceConfig) -> dict[str, Any]:
    if is_facebook_event_url(config.url):
        return extract_from_facebook_event_markdown(result, config)

    lines = [line.rstrip() for line in result.body.splitlines()]
    title = None
    description = None
    image_url = None
    source_label = config.source_label
    starts_at = None
    candidate_texts: list[str] = []
    image_candidates: list[tuple[str, str]] = []

    for index, line in enumerate(lines):
        stripped = line.strip()
        cleaned = clean_markdown_text(stripped) or ""
        if stripped.startswith("Title:") and not title:
            title = clean_text(stripped.removeprefix("Title:"))
            continue

        if stripped.startswith("# ") and not title:
            title = clean_text(stripped[2:])
            continue

        if source_label is None and stripped.startswith("URL Source:"):
            parsed_source = urlparse(clean_text(stripped.removeprefix("URL Source:")) or "")
            if parsed_source.netloc:
                source_label = parsed_source.netloc
            continue

        if starts_at is None and DATE_REGEX.search(cleaned):
            starts_at = cleaned

        if stripped.startswith("![") and "](" in stripped:
            match = re.search(r"!\[(.*?)\]\((.*?)\)", stripped)
            if match:
                alt_text = clean_markdown_text(match.group(1)) or ""
                candidate_url = clean_text(match.group(2)) or ""
                if not candidate_url.startswith("blob:"):
                    image_candidates.append((alt_text, candidate_url))
                if looks_like_event_text(alt_text):
                    candidate_texts.append(alt_text)
            continue

        if stripped.startswith("[") and "](" in stripped:
            continue

        if len(cleaned) > 25:
            candidate_texts.append(cleaned)

        if description is None and len(cleaned) > 40 and looks_like_event_text(cleaned):
            description = cleaned

        if description is None and starts_at and index > 0 and len(cleaned) > 40:
            description = cleaned

    if image_candidates:
        prioritized = sorted(
            image_candidates,
            key=lambda item: (0 if looks_like_event_text(item[0]) else 1, len(item[0]) if item[0] else 0),
        )
        image_url = prioritized[0][1]

    if not title:
        title = next((text for text in candidate_texts if looks_like_event_text(text) and len(text) < 120), None)

    if not description:
        description = next((text for text in candidate_texts if len(text) > 50), None)

    return {
        "title": title,
        "description": description,
        "imageUrl": image_url,
        "startsAt": starts_at,
        "sourceLabel": source_label,
        "_extractionMethod": result.method,
    }


def extract_fields(result: FetchResult, config: SourceConfig) -> dict[str, Any]:
    if result.content_type == "text/plain" or "Markdown Content:" in result.body[:400]:
        return extract_from_markdown(result, config)
    return extract_from_html(result, config)


def merge_field_data(target: dict[str, Any], incoming: dict[str, Any]) -> dict[str, Any]:
    for key, value in incoming.items():
        if key.startswith("_"):
            continue
        if first_non_empty(target.get(key)) is None and first_non_empty(value) is not None:
            target[key] = value
    return target


def apply_overrides(target: dict[str, Any], overrides: dict[str, Any]) -> dict[str, Any]:
    for key, value in overrides.items():
        if key == "tags":
            continue
        if value is None:
            continue
        target[key] = value
    return target


def build_fetch_order(config: SourceConfig) -> list[str]:
    hostname = urlparse(config.url).hostname or ""
    proxy_first = config.use_text_proxy or hostname.lower() in PROXY_FIRST_HOSTS
    return ["proxy", "direct"] if proxy_first else ["direct", "proxy"]


def scrape_source(config: SourceConfig, timeout: float) -> tuple[dict[str, Any], list[str]]:
    merged: dict[str, Any] = {}
    errors: list[str] = []
    extraction_chain: list[str] = []

    for method in build_fetch_order(config):
        try:
            result = fetch_document(config.url, method, timeout)
            extracted = extract_fields(result, config)
            merge_field_data(merged, extracted)
            extraction_chain.append(method)
        except (HTTPError, URLError, TimeoutError) as error:
            errors.append(f"{method}: {error}")
        except Exception as error:  # pragma: no cover - defensive fallback
            errors.append(f"{method}: {error}")

    overrides = config.overrides.copy()
    apply_overrides(merged, overrides)

    hostname = urlparse(config.url).hostname or ""
    merged["slug"] = first_non_empty(config.slug, merged.get("slug"), slugify(merged.get("title") or hostname))
    merged["sourceUrl"] = config.url
    merged["sourceDomain"] = hostname
    merged["sourceLabel"] = first_non_empty(merged.get("sourceLabel"), hostname)
    merged["tags"] = unique_list(config.tags + list(overrides.get("tags", []))) if isinstance(overrides.get("tags"), list) else config.tags
    merged["status"] = first_non_empty(overrides.get("status"), merged.get("status"), "scheduled")
    merged["extractionChain"] = extraction_chain

    required_keys = ["title", "description", "imageUrl", "startsAt"]
    merged["missingFields"] = [key for key in required_keys if not clean_text(merged.get(key))]
    if errors:
        merged["fetchErrors"] = errors

    return merged, errors


def write_output(path: Path, source_path: Path, events: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generatedAt": datetime.now(UTC).isoformat(),
        "sourceFile": source_path.as_posix(),
        "count": len(events),
        "events": events,
    }
    path.write_text(json.dumps(payload, ensure_ascii=True, indent=2) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="Path to the source event JSON.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Path to the generated output JSON.")
    parser.add_argument("--timeout", type=float, default=20.0, help="Per-request timeout in seconds.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        configs = load_source_configs(args.input)
    except Exception as error:
        print(f"Could not read source config: {error}", file=sys.stderr)
        return 1

    events: list[dict[str, Any]] = []
    for config in configs:
        event, _errors = scrape_source(config, args.timeout)
        events.append(event)

    write_output(args.output, args.input, events)
    print(f"Wrote {len(events)} events to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
