<div align="center">

# GeoShuffle

### A sliding puzzle game with p2p multiplayer.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](https://geoshuffle.bittu.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](/LICENSE)

</div>

---

### What is GeoShuffle?

GeoShuffle is a geography sliding puzzle game. Players solve scrambled satellite images of landmarks and geography locations around the globe, racing against the clock and their moves counter.

### Features

- **P2P Multiplayer**: Challenge friends or match with random players globally (using PeerJS and [PeerBasket](https://peerbasket.bittu.dev)).
- **Leaderboards**: Compete for top ranks in global leaderboards.
- **Shareable Scorecards**: Instantly generate scorecards to download or share.

### Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript, CSS3
- **Animations**: GSAP, GSAP Flip
- **Multiplayer**: PeerJS, WebRTC, PeerBasket
- **Database**: Supabase
- **Bundler**: Vite

### Self-Hosting

```bash
npm install
npm run dev
npm run build
```
