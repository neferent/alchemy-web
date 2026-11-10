# Alchemy

A visual node-graph editor for building stream overlay widgets in the browser. Draw named areas on a 16:9 canvas, wire up an event-driven node graph for each area, and export a self-contained HTML/CSS/JS widget that reacts to streaming events such as donations, follows and subscriptions.

The idea originated as a Streamlabs hackathon concept in 2019; this implementation was created independently by Edward.

## Features

- **Canvas editor**: draw, move and rename areas. Positions are stored as percentages, so layouts are resolution-independent.
- **Node graph per area** (Vue Flow, with dagre auto-layout and a timeline view):
  - **Triggers**: On Event, On Timer, End Signal
  - **Lifecycle**: Transient, Persistent and Container nodes, which hold visual elements; Audio
  - **Transitions**: Fade In, Fade Out, Slide In
  - **Logic**: Condition, Delay, Set/Get/Reset Variable, Math, Compare, Clamp, Random, String Format, To Number, To String
- **Visual elements**: images, text, video and color blocks, with opacity, drop shadow and animate.css animations. GIFs, stickers and clips can be searched through [KLIPY](https://klipy.com).
- **Live preview**: fire simulated events and watch scenes play out on the canvas.
- **Widget export**: generates standalone HTML, CSS and JS you can copy into a custom widget.
- **Save/load** scenes as `.alchemy` JSON files, plus built-in sample scenes and in-app help.

## Getting started

Requires Node.js and npm.

```bash
npm install
npm run dev
```

### KLIPY API key (optional)

The GIF, sticker and clip pickers need a KLIPY API key. Copy `.env.example` to `.env` and fill it in (`.env` is git-ignored):

```
KLIPY_API_KEY=your-key-here
```

The key is server-side only. The browser never sees it: the app calls `/api/klipy`, a proxy that adds the key and forwards the request to KLIPY. In development the proxy is a Vite dev-server plugin (`vite.config.ts`); in production it is a Vercel function (`api/klipy.ts`), where you set `KLIPY_API_KEY` under Project Settings > Environment Variables. Do not give it a `VITE_` prefix, or it would be bundled into the public site.

Everything else works without it.

### Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm run preview     # preview the production build
npm run test        # run tests (vitest)
npm run typecheck   # type-check with vue-tsc
```

## Project structure

```
api/             # Vercel serverless function: KLIPY proxy
src/
├── App.vue         # root layout: header and resizable split panes
├── presets.ts      # built-in sample scenes
├── types/          # shared types and node definitions
├── stores/         # Pinia stores: canvas, graph, layout, elements, runtime, ui
├── engine/         # graph executor (with tests)
├── exporter/       # standalone widget generator
├── services/       # KLIPY API client (calls the /api/klipy proxy)
├── nodes/          # one Vue Flow node component per node type
├── components/     # canvas, node graph panel, palette, pickers, export modal, help
└── utils/
```

### Adding a node type

1. Add it to `NODE_TYPES` in `src/types/index.ts`.
2. Create `src/nodes/MyNode.vue`.
3. Register it in `NodeGraphPanel.vue`.
4. Implement it in both `src/engine/executor.ts` and the hand-written JS runtime in `src/exporter/generateWidget.ts`. The exporter mirrors the executor and is not auto-generated, so the two must be kept in sync.

## Deployment

The app is a static single-page app, deployed on Vercel. `vercel.json` rewrites all non-`/api` routes to `index.html`. `/api/klipy` runs as a serverless function.

## Tech stack

Vue 3, TypeScript, Vite, Pinia, Vue Flow, Vitest.

## License

Proprietary. Copyright (c) 2026 Edward. All rights reserved. The source is viewable for reference only; see [LICENSE](LICENSE).

The KLIPY logos in `public/` and the "Powered by KLIPY" attribution belong to their owner.
