# HCM Ale Trail — Real-world entry & auth sequence

Live app: **https://hcm.thealetrail.app**
Trail ID (HCM): `89e5e2d6-090b-448a-8e53-6d05b731a921`

This is how a person actually gets in today, verified against the deployed app and the code.

---

## 1. How people arrive

Three real-world entry points, all landing on the same URL:

1. **QR code at a brewery** — physical QR on the bar/table. Two QR types exist:
   - a general marketing/trail QR (→ app root, "join the trail")
   - a per-brewery check-in QR (→ check-in for that specific venue)
2. **Instagram / Facebook link** — bio links and event posts from BiaCraft, Heart of Darkness, etc.
3. **Word of mouth / direct URL** at the venue.

There is no native app. It is a mobile web app, so there is no install step.

## 2. What happens on first load (verified live)

```
Load hcm.thealetrail.app
  → Language picker is present at the top at all times (EN / VN / KR / JP)
  → SCREEN 1: Age gate — "CONFIRM YOUR AGE", single button "I CONFIRM I'M 18+"
      (stored as hcm-age-confirmed-at in localStorage; synced to the server
       field legal_age_confirmed_at once the user authenticates, in both directions)
  → SCREEN 2: SIGN IN — hard gate. Email + password, "Sign in with Google", or "Sign up".
```

**The important finding for hand-off design:** authentication is a *hard wall immediately after the age gate*. A person who scans a QR at a bar cannot see the brewery list, the map, or anything else until they have an account. There is no guest/browse mode and no deferred sign-up.

## 3. Account creation

- `POST /api/auth/register` — email, password, name. Creates the Supabase Auth user with `email_confirm: true`, i.e. **no confirmation email, no email round-trip**, then inserts a `participants` row keyed to the auth user id.
- Google OAuth via Supabase (`signInWithOAuth`, provider `google`) is the other path.
- `POST /api/auth/login` returns JWTs. Frontend stores `hcm-access-token`, `hcm-refresh-token`, `hcm-expires-at` in localStorage.

Identity rule that matters for integration: **`participants.id == Supabase auth user id`.** There is no separate join key.

## 4. Joining the trail

`POST /api/trails/:trailId/join` with a Bearer token. It upserts a `participants` row carrying `trail_id`, `email`, `display_name`. Joining is therefore an authenticated action — a user cannot join before they have an account.

`GET /api/trails/:trailId/qr` is the "boot" endpoint a QR scan resolves to: it returns the trail record, the `stampTarget` (count of active breweries), and the next URLs the frontend should call (`join`, `breweries`, `events`, `me`, `leaderboard`).

## 5. Profile onboarding (after auth, before the trail proper)

A 7-step flow (`OnboardingFlow.jsx`), one question per screen with a progress bar:

`lifestyle → beer_styles → location (+country) → era → gender → avatar → display_name`

All of it lands on the `participants` row (`vibe`, `beer_styles`, `home_city`, `home_country`, `era`, `gender`, `avatar`, `display_name`, `birth_year`, `group_size`, `neighborhood`), with `onboarding_completed_at` as the completion marker.

## 6. The loop itself

```
Brewery list / map  →  open a brewery  →  Scan QR (html5-qrcode, loaded on demand)
                                          or type the 4-digit manual code
   →  check-in written to `checkins`  →  stamp added to the card
   →  rate beers (1–5 + notes)        →  progress bar X / stamp_target
   →  all stamps  →  hat claim / merch pickup  →  leaderboard (fastest completion)
   →  optional: reset card for a new round (`card_round`)
```

Side quests run parallel to brewery stamps with their own check-ins and ratings.

---

## What this means for a Made SMPL → Ale Trail hand-off

The sequence a user currently experiences is: **age gate → sign up → join trail → 7-step profile → trail**. If Made SMPL hands someone across cold, they hit a sign-up wall within two taps and it will read as "I've been dumped into a different app."

The three things that would make the hand-off feel continuous:

1. **Carry the identity across.** Since `participants.id` is the Supabase auth user id, the cleanest hand-off is a shared or federated auth session, or a signed hand-off token that the Ale Trail side exchanges for a session — so the user never sees a sign-in screen.
2. **Pre-fill or skip onboarding.** Most of the 7 steps (display name, location, avatar, styles) are data Made SMPL would likely already hold. Passing them at join time and setting `onboarding_completed_at` turns 7 screens into 0.
3. **Auto-join the trail.** `POST /api/trails/:trailId/join` on the way in, so the user lands on the brewery list with a live stamp card rather than a "Join Trail" prompt.

Whether the age gate should also carry across is a policy call — the field exists on both sides (`legal_age_confirmed_at`) so it is technically transferable.

---

## Not captured

Screens past the sign-in wall could not be captured without creating an account. A real screen recording from a phone (home, brewery list/map, brewery detail, QR scan, stamp success, progress, completion/reward) would show the feel far better than static captures anyway — that is the one piece worth recording by hand.
