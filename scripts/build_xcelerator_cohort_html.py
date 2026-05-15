#!/usr/bin/env python3
"""Emit static HTML for 2026 Spring Cohort cards from mockup cohort.json."""
import html
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_JSON = Path(__file__).resolve().parents[2] / "Berkeley-RDI-Xcelerator-Cohort-Mockup" / "data" / "cohort.json"
IMG_PREFIX = "/assets/images/xcelerator-cohort-2026/"


def static_to_asset(path: str) -> str:
    if not path:
        return ""
    return path.replace("/static/img/", IMG_PREFIX)


def website_label(url: str) -> str:
    s = url.replace("https://", "").replace("http://", "").replace("/", "")
    return s


def gradient_style(loop_index: int) -> str:
    h1 = (loop_index * 47) % 360
    h2 = (loop_index * 47 + 80) % 360
    return (
        f"background: linear-gradient(135deg, hsl({h1}, 55%, 50%), hsl({h2}, 55%, 35%));"
    )


def company_front(c: dict, idx: int) -> str:
    name = html.escape(c["name"])
    tagline = html.escape(c["tagline"])
    logo = c.get("logo") or ""
    icon = c.get("icon") or ""
    initial = html.escape(c["name"][0] if c["name"] else "?")

    if logo:
        src = html.escape(static_to_asset(logo))
        return f"""          <div class="a16z-card-front">
            <div class="a16z-logo a16z-logo-img"><img src="{src}" alt="{name}"></div>
              <h3>{name}</h3>
            <p class="a16z-tagline">{tagline}</p>
            <p class="a16z-hover-hint">Hover for founders →</p>
          </div>"""
    if icon:
        src = html.escape(static_to_asset(icon))
        return f"""          <div class="a16z-card-front">
            <div class="a16z-logo a16z-logo-img"><img src="{src}" alt="{name}"></div>
              <h3>{name}</h3>
            <p class="a16z-tagline">{tagline}</p>
            <p class="a16z-hover-hint">Hover for founders →</p>
          </div>"""
    style = gradient_style(idx)
    return f"""          <div class="a16z-card-front">
            <div class="a16z-logo" style="{html.escape(style)}">
                {initial}
              </div>
              <h3>{name}</h3>
            <p class="a16z-tagline">{tagline}</p>
            <p class="a16z-hover-hint">Hover for founders →</p>
          </div>"""


def founder_rows(founders: list) -> str:
    parts = []
    for f in founders:
        fn = html.escape(f["name"])
        title = html.escape(f["title"])
        bio = html.escape(f["bio"])
        li = (f.get("linkedin") or "").strip()
        hs = (f.get("headshot") or "").strip()
        li_html = ""
        if li:
            li_esc = html.escape(li, quote=True)
            li_html = f'<a href="{li_esc}" target="_blank" rel="noopener" class="a16z-founder-linkedin">in</a>'
        if hs:
            src = html.escape(static_to_asset(hs))
            head = f'<img class="a16z-founder-headshot" src="{src}" alt="{fn}">'
        else:
            initial = html.escape(f["name"][0] if f.get("name") else "?")
            head = f'<div class="a16z-founder-headshot a16z-founder-headshot-placeholder">{initial}</div>'
        parts.append(
            f"""                <div class="a16z-founder">
                  {head}
                  <div class="a16z-founder-info">
                    <div class="a16z-founder-name">
                      {fn} <span class="a16z-founder-title">— {title}</span> {li_html}
                    </div>
                    <p class="a16z-founder-bio">{bio}</p>
                  </div>
                </div>"""
        )
    return "\n".join(parts)


def company_back(c: dict) -> str:
    name = html.escape(c["name"])
    desc = html.escape(c["description"])
    founders_html = founder_rows(c.get("founders") or [])
    hq = html.escape(str(c.get("hq") or ""))
    yf = c.get("year_founded")
    founded = html.escape(f"Founded {yf}") if yf is not None else ""

    ws = (c.get("website") or "").strip()
    email = (c.get("email") or "").strip()
    li_co = (c.get("linkedin") or "").strip()
    links = []
    if ws:
        label = html.escape(website_label(ws))
        ws_esc = html.escape(ws, quote=True)
        links.append(
            f'<a href="{ws_esc}" target="_blank" rel="noopener" class="a16z-link">{label} ↗</a>'
        )
    if email:
        email_esc = html.escape(email, quote=True)
        links.append(
            f'<a href="mailto:{email_esc}" class="a16z-link">{email_esc} ✉</a>'
        )
    if li_co:
        li_esc = html.escape(li_co, quote=True)
        links.append(
            f'<a href="{li_esc}" target="_blank" rel="noopener" class="a16z-link">LinkedIn ↗</a>'
        )
    links_html = "\n              ".join(links) if links else ""

    return f"""          <div class="a16z-card-back">
            <h4>{name}</h4>
            <p class="a16z-desc">{desc}</p>
            <div class="a16z-founders">
{founders_html}
            </div>
            <div class="a16z-meta">
              <span>{hq}</span>
              <span>{founded}</span>
            </div>
            <div class="a16z-links">
              {links_html}
            </div>
          </div>"""


def main() -> None:
    json_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_JSON
    data = json.loads(json_path.read_text(encoding="utf-8"))
    cohort_name = html.escape(data.get("cohort_name", "2026 Spring Cohort"))
    # Match mockup app/main.py: only featured companies (others still being collected)
    companies = [c for c in data["companies"] if c.get("featured")]

    cards = []
    for i, c in enumerate(companies, start=1):
        cards.append(
            f"""      <article class="a16z-card">
        <div class="a16z-card-inner">
{company_front(c, i)}
{company_back(c)}
        </div>
      </article>"""
        )

    out = f"""        <section class="content-section">
            <div class="container">
                <h2 class="section-title">{cohort_name}</h2>
            </div>
        </section>

        <section class="a16z-grid-section">
            <div class="container">
                <div class="a16z-grid">
{chr(10).join(cards)}
                </div>
            </div>
        </section>
"""
    sys.stdout.write(out)


if __name__ == "__main__":
    main()
