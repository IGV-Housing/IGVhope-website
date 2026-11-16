# Employer Pack build

Builds the downloadable Employer Pack. Nothing is published on the website: the zip is written to `dist/IGVhope-Employer-Pack.zip` (git-ignored) for upload to myIGVhope.

```
cd scripts/employer-pack
npm install
npm run build            # everything
node build.mjs 03        # just one asset (prefix of its source file)
```

- Needs Microsoft Edge or Chrome (set `EDGE` to its path if not found). PDFs and PNGs are rendered from the HTML in `src/`.
- Word files are generated in `docx-assets.mjs`.
- Links, display URL and contact email are in `CONFIG` at the top of `build.mjs`. Each QR code adds its own `utm_medium` so GA4 shows which asset drove the visit.
- The build warns if a PDF runs over its page count.
- Every build re-creates the zip in `dist/` from the loose files there.
