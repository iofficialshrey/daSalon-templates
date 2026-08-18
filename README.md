# da Salon Templates

A collection of custom salon and spa frontends built with Next.js.

## Requirements

- Node.js 22
- npm

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
npm run lint
npm test
```

`npm test` creates a production build and verifies that the collection and both
template routes are prerendered correctly.

## Deploy to Vercel

Import the GitHub repository into Vercel. Vercel will detect Next.js and use:

- Install command: `npm install`
- Build command: `npm run build`
- Output directory: managed automatically by Next.js
- Node.js version: 22.x

No environment variables, databases, storage bindings, or custom output
directory are required for the current site.
