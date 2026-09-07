# The Free I Ching

A quiet I Ching oracle with two intentional reading roles:

- **Inquirer** puts meaning and reflection first.
- **Adept** adds trigrams, line values, changing-line text, sources, and method detail.

The app also includes a searchable 64-hexagram library, a Four-Sphere-inspired
reflection layer, and a journal for practices and later follow-up. See
[`THIRD_PARTY_TEXT.md`](./THIRD_PARTY_TEXT.md) for text provenance.

## Local development

Create an `.env.local` file with the Base44 application settings:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

```

Then run:

```sh
npm install
npm run dev
```

Quality checks:

```sh
npm test
npm run lint
npm run build
```

## Optional yearly support

The web app shows a dismissible invitation after a completed reading when
`VITE_STRIPE_SUPPORT_URL` is configured. Set it to the public URL of a Stripe
Payment Link for the $10/year contribution. Card data stays on Stripe; no
secret Stripe key is used by the app.

The invitation is deliberately disabled in the native iOS build. See
[`APP_STORE_SUBMISSION.md`](./APP_STORE_SUBMISSION.md) for the App Store payment
rules and release checklist.

## iOS

The Capacitor project uses bundle ID `com.thefreeiching.app` and bundles the
complete Vite build for offline use. Install dependencies, then run:

```sh
npm run native:sync
npm run native:open
```

Select an Apple development team in Xcode before signing or archiving. The app
icon, splash assets, privacy route, metadata, and review notes are included in
the repository.

App support and privacy inquiries use `morphiclabsdata@gmail.com` and the public
support page at `https://thefreeiching.com/support`.
