# da Salon Brand Home

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

`npm test` creates a production build and verifies that the collection and all
Brand Home routes are prerendered correctly.

## Deploy to Vercel

Import the GitHub repository into Vercel. Vercel will detect Next.js and use:

- Install command: `npm install`
- Build command: `npm run build`
- Output directory: managed automatically by Next.js
- Node.js version: 22.x

No database, storage binding, or custom output directory is required.

## da Salon booking integration

Copy `.env.example` to `.env.local` and provide the environment-specific API
base URL and partner key:

```bash
DASALON_API_BASE_URL=https://your-partner-api-host/partner-api/api/v1
DASALON_PARTNER_API_KEY=pk_live_...
```

Add the same variables to the deployment environment. Do not expose the key as
a `NEXT_PUBLIC_` variable. The browser talks only to the allowlisted Next.js
routes under `/api/dasalon`; those server routes add the private partner key,
validate venue and service ownership, and calculate appointment totals from the
live catalog.

The base URL must include the complete Partner API service path supplied by
da Salon. For the current staging service that path ends in
`/partner-api/api/v1`; do not use the dashboard API path.

All six Brand Homes now read the same live services, prices, durations, working
dates, and time slots before creating `WEBSITE` appointments with pay-at-venue
checkout. Fictional Brand Home names and editorial content remain independent,
while every bookable service card passes its real catalog id into the shared
booking flow. The client refreshes the catalog periodically so venue-side menu
changes appear without introducing a second frontend source of booking data.
