# App Store submission

## App record

- **Name:** The Free I Ching
- **Subtitle:** The Book of Changes
- **Bundle ID:** `com.thefreeiching.app`
- **Version:** 1.0
- **Build:** 3
- **Primary category:** Lifestyle
- **Secondary category:** Reference
- **Price:** Free
- **Privacy policy URL:** `https://thefreeiching.com/privacy`
- **Support URL:** `https://thefreeiching.com/support`
- **Support email:** `morphiclabsdata@gmail.com`
- **Marketing URL:** `https://thefreeiching.com`
- **Copyright:** Use the legal name and year shown in the Apple Developer account.

## Promotional text

Consult the I Ching, explore every hexagram, and keep a private reflection journal on your device.

## Description

The Free I Ching is a calm, transparent way to consult the Book of Changes.

Choose a quick oracle cast with traditional yarrow weighting or enter your own three-coin tosses line by line. Consult as an Inquirer when you want a clear place to begin, or as an Adept for trigrams, changing lines, method details, and source notes.

The app also includes:

- A searchable guide to all 64 hexagrams
- A private journal stored on your device
- Practices and follow-up dates for returning to a reading
- A timeline for seeing how your reflections develop
- An optional one-time Supporter Upgrade with a gilded icon and flowing-water background
- No required account or advertising; the full oracle and all content remain free

The I Ching offers a structure for reflection. It does not predict outcomes or replace professional medical, legal, financial, or mental-health advice.

## Keywords

`i ching,yijing,book of changes,hexagram,oracle,reflection,journal,dao,three coins`

## App Review notes

The app bundles its working content and is more than a web link. Reviewers can cast a reading immediately from the first screen, choose either casting method, switch between Inquirer and Adept views, save the result locally, add a practice, browse all 64 hexagrams, and view saved readings in the Journal and Timeline.

No login is required. Journal content remains in local WebKit storage on the device and can be erased from Privacy inside the app. The iOS build suppresses the website's Google AdSense placements, local account prototype, and Stripe support invitation.

Version 1.0 includes one non-consumable In-App Purchase, Supporter Upgrade (`com.thefreeiching.app.supporter`), accessible from Upgrade in the native top navigation. It unlocks only a gilded alternate icon and flowing-water background; the full oracle and all content remain free. Restore Purchases is available at the bottom of the Supporter screen.

Text provenance is documented in `THIRD_PARTY_TEXT.md`. The included changing-line source is CC0; the remaining contemporary interpretations are original to the app.

## App Privacy answers

For the native version described above, select **Data Not Collected**. The app does not include advertising, analytics, tracking, account registration, or payment processing. User-created readings and journal text remain on the device.

Recheck this answer before every submission. Adding analytics, crash reporting, advertising, cloud sync, accounts, or payments changes the disclosure.

## Export compliance

The app does not implement non-exempt encryption. `ITSAppUsesNonExemptEncryption` is set to `false` in `Info.plist`.

## Required screenshots

App Store Connect accepts one to ten PNG or JPEG screenshots without transparency. This project targets both iPhone and iPad, so prepare at least:

- iPhone 6.9-inch portrait: use an accepted device size such as 1320 by 2868 from iPhone 17 Pro Max.
- iPad 13-inch portrait: use 2064 by 2752 from iPad Pro 13-inch.

Five verified iPhone screenshots and three verified iPad screenshots are included in `app-store/screenshots/`. They use Apple's accepted native dimensions and JPEG encoding without transparency.

Suggested sequence:

1. Consultation screen with the Inquirer and Adept roles
2. Both casting methods
3. Adept reading with changing-line and trigram detail
4. Hexagram library
5. Private journal

## Release checklist

1. Join or renew the Apple Developer Program.
2. Create the app record using the bundle ID above.
3. Open `ios/App/App.xcworkspace` in Xcode and select the correct development team.
4. Confirm version 1.0 and build 3, then test on a physical iPhone and iPad.
5. Run `npm run native:sync` before archiving so the latest web bundle is included.
6. Archive the `App` scheme with a generic iOS device selected.
7. Upload through Xcode Organizer and complete automated processing.
8. Add the metadata, privacy answers, age rating, content rights, screenshots, and review notes above.
9. Test the processed build through TestFlight before submitting it for review.

## Native Supporter Upgrade

The native app uses a $9.99 one-time, non-consumable StoreKit product (`com.thefreeiching.app.supporter`). It unlocks the gilded alternate icon and flowing-water background. Do not expose the web Stripe link inside the iOS app.
