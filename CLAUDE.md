# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Storage Explorer is a browser extension (Chrome, Firefox, Edge) that allows users to view, copy, and search localStorage/sessionStorage content from any webpage. It auto-deserializes JSON strings into a tree structure for easy navigation.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development (Chrome)
pnpm dev

# Development (Firefox)
pnpm dev:firefox

# Production build (Chrome)
pnpm build

# Production build (Firefox)
pnpm build:firefox

# Create extension zip for distribution
pnpm zip            # Chrome
pnpm zip:firefox    # Firefox

# Run e2e tests (requires zip first)
pnpm e2e
pnpm e2e:firefox

# Code quality
pnpm lint           # Run ESLint
pnpm lint:fix       # Run ESLint with auto-fix
pnpm prettier       # Run Prettier
pnpm type-check     # TypeScript type checking
```

## Architecture

**Monorepo Structure** (pnpm workspaces + Turborepo):

- `chrome-extension/` - Extension manifest and core config (manifest.ts defines permissions, icons, popup entry)
- `pages/popup/` - Main popup UI (React + Tailwind). Entry point is `src/Popup.tsx`
- `packages/` - Shared internal packages with `@extension/` namespace:
  - `env` - Environment variables from `.env` (CEB_* prefixed)
  - `hmr` - Hot module reload plugins for Vite
  - `i18n` - Internationalization (locales in `locales/`)
  - `shared` - React HOCs (withErrorBoundary, withSuspense) and hooks
  - `storage` - Chrome storage API abstractions
  - `ui` - Shared UI components
  - `vite-config` - Vite configuration (withPageConfig)
  - `dev-utils` - Manifest parser utilities
  - `zipper` - Extension packaging
- `tests/e2e/` - WebdriverIO e2e tests

**Key Data Flow** (popup):

1. `storage.ts:getStorageContent()` - Uses `chrome.scripting.executeScript` to read localStorage/sessionStorage from active tab
2. `storage.ts:parseRecursive()` - Recursively parses storage values, auto-detecting JSON, numbers, URLs. Returns `TreeNode` structure
3. Context providers in Popup.tsx manage state: `StorageTreeProvider`, `SelectedTreeProvider`, `StorageTypeProvider`, `BookmarkProvider`
4. `TreeExplorer.tsx` renders navigable tree; `TreeViewer.tsx` shows selected node content

**Build System**:

- Turborepo orchestrates builds with task dependencies in `turbo.json`
- Environment variables: CLI args (CLI_CEB_*) get converted to .env vars via `bash-scripts/set_global_env.sh`
- Firefox builds use `CLI_CEB_FIREFOX=true` flag

## Important Notes

- Extension requires `scripting` permission granted per-origin to access page storage
- Tree parsing handles nested JSON strings (strings containing JSON are recursively parsed)
- URL values are parsed and expanded to show components (host, pathname, query params, etc.)
