---
epic: 1
story: 1.1
id: 1-1-project-initialization-build-setup
title: Project Initialization & Build Setup
status: done
---

# Story 1.1: Project Initialization & Build Setup

## Description
As a Developer,
I want to initialize the repository with CRXJS, Vue 3, TypeScript, and the dual-styling system,
So that I have a stable foundation for developing the browser extension.

## Acceptance Criteria
- **Given** a clean working directory
- **When** I run `npm install` and `npm run dev`
- **Then** the project should start without errors
- **And** I should see a functioning Side Panel with Shadcn/Tailwind styles
- **And** I should see a Content Script injected with `zy-` prefixed Tailwind styles (isolated via Shadow DOM)
- **And** the `manifest.json` should be valid V3 configuration

## Implementation Notes
- Use `npm create crxjs@latest`
- Configure `vite.config.ts` for dual output (extension + side panel)
- Setup Tailwind with prefix `zy-` for content scripts
- Setup Shadow DOM helper for injection

## Tasks
- [x] Initialize project with CRXJS
- [x] Configure Tailwind CSS
- [x] Setup Directory Structure
- [x] Implement Side Panel Styling
- [x] Implement Content Script Styling (Shadow DOM + Prefix)
- [x] Update Manifest V3

## Architecture Enhancements (from Code Review)
- [x] Install webext-bridge for IPC layer
- [x] Install Pinia for state management
- [x] Install @vueuse/core for storage abstraction
- [x] Create complete project directory structure per architecture
- [x] Implement typed IPC messaging layer (src/logic/messaging/)
- [x] Implement storage abstraction (src/logic/storage/)
- [x] Create Pinia stores (settings-store, ai-store)
- [x] Create AI service layer skeleton (src/logic/ai/)
- [x] Create system prompt templates (src/logic/prompts/)
- [x] Enhance background script with event listeners
- [x] Initialize Pinia in Side Panel
- [x] Remove unused HelloWorld component
- [x] Add Chrome types to tsconfig
- [x] Integrate content styles build into dev/build scripts
- [x] Create Shadcn/Vue configuration

## Files Created/Modified
**Core Architecture:**
- `src/types/shim.d.ts` - ProtocolMap type definitions
- `src/logic/messaging/index.ts` - Typed IPC bridge
- `src/logic/storage/index.ts` - VueUse storage abstraction
- `src/stores/settings-store.ts` - Settings state management
- `src/stores/ai-store.ts` - AI state management
- `src/logic/ai/client.ts` - AI client skeleton
- `src/logic/ai/stream-parser.ts` - Stream parser skeleton
- `src/logic/prompts/index.ts` - System prompt templates

**Configuration:**
- `package.json` - Added pinia, @vueuse/core, webext-bridge
- `tsconfig.app.json` - Added chrome types
- `components.json` - Shadcn configuration (existing)

**Application:**
- `src/background/index.ts` - Enhanced with event listeners
- `src/side-panel/main.ts` - Pinia initialization
- Removed: `src/components/HelloWorld.vue`

## Review Notes
- ✅ All CRITICAL architecture violations fixed
- ✅ Complete directory structure implemented
- ✅ Core dependencies installed
- ✅ TypeScript configuration updated
- ✅ Build scripts enhanced
- ✅ Ready for Story 1-2 (IPC Bridge Implementation)
