---
epic: 1
story: 1.1
id: 1-1-project-initialization-build-setup
title: Project Initialization & Build Setup
status: review
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
