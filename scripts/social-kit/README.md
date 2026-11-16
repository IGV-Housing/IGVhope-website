# Social Kit build

Builds the downloadable Social Kit for program participants: a webinar tile, the Secure / Live / Own
house-building video (square and vertical), an "I checked my eligibility" carousel and a caption pack (Word).
The only output published on the site is `public/assets/files/IGVhope-Social-Kit.zip`; the loose files
live in `dist/` (git-ignored).

```
cd scripts/social-kit
npm install
npm run build              # everything (the video takes a few minutes)
node build.mjs tile        # or: video | carousel | captions
```

- Needs Microsoft Edge or Chrome (set `EDGE` to its path if not found). The video is captured frame by frame and
  encoded with the bundled ffmpeg.
- Webinar dates, links and the contact email are in `CONFIG` at the top of `build.mjs`. Update the dates when the
  site's `WEBINAR_DAYS` change, then rebuild.
- Each QR code carries its own `utm_medium` so GA4 shows which post drove the visit.
- Every build re-creates the zip from `dist/`, so there is only ever one downloadable copy.
