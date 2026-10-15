# Building a comic book pipeline with AI

A guide, for humans and AI agents, to building a code-driven comic production pipeline: scripts become lettering, panels become layers, and the same layers become print pages and motion pieces. It includes an interview script an agent can use with the artist first, and it says plainly what was and was not verified.

- Read it: the site's `index.html`
- PDF: `guide.pdf`
- Diagrams: `diagrams/`

## Rebuild

The page is generated from the article's Markdown:

```
npm install
node build.mjs          # writes index.html
SITE_URL=https://example.github.io/repo node build.mjs   # sets the social-preview URLs
```

All rights reserved unless a licence is added.
