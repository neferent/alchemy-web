# Alchemy Web

Visual node-graph editor for building Streamlabs stream overlay widgets. Users draw areas on a canvas, wire up event-driven node graphs (triggers, transitions, logic, containers), and export self-contained HTML/CSS/JS widgets.

## Tech Stack

- Vue 3 (Composition API, `<script setup>`) + TypeScript + Vite
- Pinia for state management
- Vue Flow (`@vue-flow/core`) for node graph rendering
- Dagre (`@dagrejs/dagre`) for auto-layout
- animate.css for element animations
- Deployed on Vercel (SPA with catch-all rewrite)

## Commands

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run test` - run tests (vitest)
- `npm run typecheck` - run `vue-tsc --noEmit`
- `npm run preview` - preview production build

## Project Structure

```
src/
  App.vue              # Root layout: header, resizable split panes
  main.ts              # App entry point
  types/index.ts       # Shared types (Area, NodeCategory, ElementData, NODE_TYPES)
  engine/executor.ts   # Graph execution engine (walks nodes, resolves scenes)
  exporter/generateWidget.ts  # Exports scene as standalone HTML/CSS/JS widget
  stores/
    canvas.ts          # Areas (rectangular regions on the canvas)
    graph.ts           # Node graphs per area (nodes + edges)
    layout.ts          # Spatial layout of elements within areas/containers
    elements.ts        # Visual elements (image, text, video, color) per node
    runtime.ts         # Live preview: fires events, manages active scenes & timers
    ui.ts              # Transient UI state (selections, hover, drag)
  nodes/               # Vue Flow custom node components (one per node type)
  components/          # UI panels (NodeGraphPanel, AppCanvas, NodePalette, etc.)
```

## Key Concepts

- **Areas**: Rectangular overlay regions on the canvas, each with its own node graph.
- **Node types** are defined in `types/index.ts` (`NODE_TYPES` array) with categories: trigger, lifecycle, transition, logic.
- **Executor** (`engine/executor.ts`) walks the graph from a trigger node, evaluating logic nodes, collecting transitions, and resolving container/element content into `RenderItem` trees.
- **Exporter** (`exporter/generateWidget.ts`) mirrors the executor logic as standalone JS. Both files must stay in sync when node types or data fields change.
- Path alias: `@/` maps to `src/`.

## Save Format

Scenes are saved/loaded as `.alchemy` JSON files (version 2) containing areas, graphs (slim nodes + edges), layout, and elements.
