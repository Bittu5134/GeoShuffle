<div align="center">
<img src="./src/assets/logo.png", width="300" alt="GeoShuffle gameplay" />

# Geo · Shuffle

### **A sliding puzzle featuring geographical locations with P2P multiplayer.**
### [Play now at geoshuffle.bittu.dev](https://geoshuffle.bittu.dev)

[![Discord](https://img.shields.io/discord/877508637814300683?logo=discord&logoColor=white)](https://bittu.dev/discord)
[![Patreon](https://img.shields.io/badge/Patreon-LazyBittu-F96854?logo=patreon&logoColor=white)](https://www.patreon.com/cw/LazyBittu)

<br>

<img src="screenshots/fullscreen.png" width="850" alt="GeoShuffle gameplay" />

<br>

</div>

## How To Play

- Every match scrambles a satellite view of a landmark on Earth.
- Slide tiles into the empty space to reconstruct the complete satellite photo.
- Hints unlock after 45 seconds if you're stuck.
- Minimize your move count to rank higher.
- Complete the puzzle to reveal the location, and get a scorecard.


## Controls

- Slide tiles using `W` `A` `S` `D` or `Arrow` keys.
- Click or tap any tile along the row or column of the gap to slide it.
- Swipe across the puzzle grid on touchscreens and mobile devices.


## Game Modes

The game supports both Singleplayer and Multiplayer (using [PeerBasket](https://peerbasket.bittu.dev/)).

## Scorecards & Leaderboards

<div align="center">
  <img src="screenshots/win.png" width="460" alt="GeoShuffle puzzle solved modal" />
  &nbsp;&nbsp;
  <img src="screenshots/win_card.png" width="330" alt="GeoShuffle downloadable share card" />
</div>

<br>

## Other Features

- **Global Leaderboard**: Uses Supabase for it.
- **Scorecards**: Generated on the client side.
- **P2P Multiplayer**: Uses WebRTC, PeerJS and [PeerBasket](https://peerbasket.bittu.dev/) to directly connect two browsers to enable Multiplayer gameplay without a central server.


## Support

GeoShuffle is free and ad-free. If it's useful to you, you can support development on
[Patreon](https://www.patreon.com/cw/LazyBittu), or come hang out on
[Discord](https://bittu.dev/discord).

## Run Locally

Clone this Git repository locally and run these commands:
```bash
npm install
npm run dev
```

While developing, `src/js/game.js` exposes two shortcuts you may want to tweak
(both are at production values by default — flip them on for local testing):
- `TESTING_MODE` — set to `true` to skip global leaderboard submissions (keeps test runs off the shared board).
- `SHUFFLE_STEPS` / `SHUFFLE_DELAY` / `SHUFFLE_DURATION` — drop to `5` / `0.15` / `0.45` so a solvable board is a few moves away.

The hint cooldown lives in `src/js/timer.js` as `HINT_DELAY_SECONDS` — `45` in
production, lowered to ~`5` while testing the reveal path. Remember to put all
of these back before shipping.

### Supabase (Global Leaderboard)

The global leaderboard and rank lookups talk to a [Supabase](https://supabase.com/)
project over its REST API — there is no custom backend. The project URL and
publishable key are set at the top of `src/js/api.js`:

```js
const SUPABASE_URL = "https://<project-ref>.supabase.co";
const SUPABASE_KEY = "sb_publishable_..."; // publishable (anon) key
```

To point a self-hosted copy at your own Supabase project:

1. Create a `leaderboard` table with the columns the game reads and writes:
   `player_name` (text), `time_spent` (int, seconds), `moves_made` (int).
2. Enable Row Level Security and add policies so the publishable key can
   `select` and `insert` rows (the game never updates or deletes entries).
3. Replace `SUPABASE_URL` and `SUPABASE_KEY` in `src/js/api.js` with your
   project's REST URL and publishable key (Project Settings → API).

If you skip this, the game still runs fine — leaderboard fetches just return
empty lists and score submissions fail silently in the console.

<br>

## Built Using

[GSAP](https://gsap.com/) · [GSAP Flip](https://gsap.com/docs/v3/Plugins/Flip/) · [PeerJS](https://peerjs.com/) · [PeerBasket](https://peerbasket.bittu.dev) · [Supabase](https://supabase.com/) · [Tailwind CSS](https://tailwindcss.com/) · [DaisyUI](https://daisyui.com/) · [Vite](https://vitejs.dev/)

<br>
