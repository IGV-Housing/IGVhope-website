# Employer Pack build

Builds the downloadable Employer Pack. The only output in the site is `public/assets/files/IGVhope-Employer-Pack.zip`; the loose files live in `dist/` (git-ignored).

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
- Every build re-creates the zip from `dist/`, so there is only ever one downloadable copy.
