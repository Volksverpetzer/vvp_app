# Universal / App Links association files

These static files must be served by the web/CDN layer so iOS (Universal Links)
and Android (App Links) verify our domains and open the app for article links.
They are **not** bundled into the app — they live on the websites. This folder is
the source of truth for what each domain must serve.

| File                                                      | Must be served at                                                  | Content-Type       | Status                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------ | ------------------ | ---------------------------------------- |
| `well-known/pruefpunkt.org/apple-app-site-association`    | `https://pruefpunkt.org/.well-known/apple-app-site-association`    | `application/json` | **deploy** (404 today)                   |
| `well-known/pruefpunkt.org/assetlinks.json`               | `https://pruefpunkt.org/.well-known/assetlinks.json`               | `application/json` | **deploy** (404 today)                   |
| `well-known/volksverpetzer.de/apple-app-site-association` | `https://volksverpetzer.de/.well-known/apple-app-site-association` | `application/json` | **update** (add uploads exclude)         |
| `well-known/volksverpetzer.de/assetlinks.json`            | `https://volksverpetzer.de/.well-known/assetlinks.json`            | `application/json` | already live — reference copy, no change |

Requirements:

- **No file extension** on `apple-app-site-association`, served over HTTPS with no
  redirect, `Content-Type: application/json`.
- `assetlinks.json` served over HTTPS as `application/json`.
- `www.` hosts: the sites redirect `www → apex`, so a single apex-hosted file
  suffices. If a `www` host is ever served independently, it needs the same files.

## Status (as of this change)

- **pruefpunkt.org** — both files are currently **404**. Deploy both. This is what
  blocks Prüfpunkt links from opening the app.
- **volksverpetzer.de** — both files already live (HTTP 200). The
  `apple-app-site-association` here is an **update**: it adds
  `"NOT /wp-content/uploads/*"` ahead of `"/*/*"` so iOS stops opening the app for
  upload/download links (PDFs, images) — those should download in Safari instead.
  iOS evaluates `paths` top-down (first match wins), so the `NOT` rule must come
  first. `volksverpetzer.de/.well-known/assetlinks.json` needs **no change**.

## Identifiers

- iOS appID: `LGZ66Q83U6.de.volksverpetzer.app`
- Android package: `de.volksverpetzer.app`
- Android signing SHA-256 (Play App Signing, same as live volksverpetzer.de):
  `29:60:C3:E3:7C:C4:7F:9B:8A:09:BF:77:80:B5:19:2B:25:AC:ED:14:3B:26:BD:DE:F5:2A:E3:D0:98:31:E0:FA`

## Verify after deploy

```bash
curl -sS https://pruefpunkt.org/.well-known/apple-app-site-association | jq .
curl -sS https://pruefpunkt.org/.well-known/assetlinks.json | jq .
curl -sS https://volksverpetzer.de/.well-known/apple-app-site-association | jq .
```

- Android: `https://developers.google.com/digital-asset-links/tools/generator`
  or `adb shell pm verify-app-links --re-verify de.volksverpetzer.app`.
- iOS: reinstall the app (the AASA is cached at install) or test with a fresh
  build; Apple's CDN (`app-site-association.cdn-apple.com`) may also cache.
