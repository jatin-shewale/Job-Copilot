from __future__ import annotations

from datetime import datetime
import hashlib
import re


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def stable_source_id(prefix: str, *parts: str) -> str:
    payload = "|".join(normalize_text(part).lower() for part in parts if part)
    digest = hashlib.sha1(payload.encode("utf-8")).hexdigest()[:16]
    return f"{prefix}_{digest}"


def freshness_label(posted_at: datetime) -> str:
    diff = datetime.utcnow() - posted_at
    secs = diff.total_seconds()
    if secs < 60:
        return "Just Posted"
    if secs < 600:
        return f"{int(secs // 60)} min ago"
    if secs < 3600:
        return f"{int(secs // 60)} min ago"
    if secs < 86400:
        return "Today"
    return f"{diff.days}d ago"


def compose_description(card, title: str = "", company: str = "", location: str = "") -> str:
    """Build a short detail snippet from visible card text."""
    lines = []
    if hasattr(card, "stripped_strings"):
        lines = [normalize_text(line) for line in card.stripped_strings if normalize_text(line)]

    blacklist = {normalize_text(title).lower(), normalize_text(company).lower(), normalize_text(location).lower()}
    filtered = []
    for line in lines:
        low = line.lower()
        if low in blacklist:
            continue
        if any(token in low for token in ["apply", "save", "share", "posted", "job search", "view", "more jobs"]):
            continue
        if len(line) < 20:
            continue
        filtered.append(line)

    if not filtered:
        return ""

    summary = " ".join(filtered[:3])
    return summary[:500]

