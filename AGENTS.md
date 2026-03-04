# AI Agent Instructions (AGENTS.md)

Welcome, AI Agent! This file contains the essential guidelines for contributing to `mica-mqtt-dashboard`. Please review and strictly adhere to these instructions before planning and executing modifications.

## 1. Project Overview & Tech Stack

- **Framework:** Vue 3 (Composition API) + Vite
- **Language:** TypeScript
- **State Management:** Pinia
- **UI Library:** Element Plus
- **Package Manager:** `pnpm` (>= 8.0.0 required)

## 2. Build, Lint, and Type Check Commands

This project relies on `pnpm`. **Do not use `npm` or `yarn`.**

- **Development Server:** `pnpm dev`
- **Build for Production:** `pnpm build`
- **Type Checking:** `pnpm type-check` (runs `vue-tsc --noEmit`)
- **Linting:** `pnpm lint` (fixes auto-fixable errors), `pnpm lint:check` (only checks)
- **Formatting:** `pnpm format` (runs Prettier)

### 🧪 Testing

> **Note:** There is currently no unit testing framework (like Vitest or Jest) configured in `package.json`.

- **Do not attempt to run `pnpm test`.**
- If a user requests testing or verification, default to **type-checking (`pnpm type-check`) and linting (`pnpm lint:check`)**.
- If the user explicitly asks you to write tests, prompt them to ask if you should set up `vitest` and `@vue/test-utils` first.

## 3. Code Style & Formatting Guidelines

### 🎨 Formatting (Prettier)

The project utilizes Prettier. Your generated code must adhere to these rules (from `.prettierrc`):

- **Quotes:** Single quotes (`'`) for JS/TS strings, double quotes (`"`) for HTML/Vue attributes.
- **Semicolons:** Omit semicolons at the ends of statements (`semi: false`).
- **Trailing Commas:** No trailing commas (`trailingComma: "none"`).
- **Indentation:** 2 spaces (`tabWidth: 2`).
- **Line Width:** 100 characters.

### 📝 Vue & TypeScript Conventions

- **Component Style:** Use Vue 3 `<script setup lang="ts">` syntax exclusively. Do not use the Options API.
- **Component Naming:** PascalCase for component files (e.g., `MqttConfig.vue`), but note that `vue/multi-word-component-names` is disabled, allowing single-word names if logically appropriate.
- **Typing:** Explicitly type function parameters, return types, and Pinia state. Avoid `any` where possible (it triggers ESLint warnings).
- **Icons:** Use `@element-plus/icons-vue`. They are globally registered in `main.ts`, so you can use them directly in templates (e.g., `<el-icon><Monitor /></el-icon>`).

### 📦 Imports & Exports

- **Order:**
  1. Vue & Vue ecosystem (`vue`, `vue-router`, `pinia`)
  2. Third-party libraries (`element-plus`, `echarts`, `mqtt`)
  3. Internal aliases or absolute paths (if configured)
  4. Relative paths (`./`, `../`)
- **Auto-Imports:** The project relies on `unplugin-auto-import` and `unplugin-vue-components`. Common Vue APIs (`ref`, `reactive`, `computed`) and Element Plus components (`<el-button>`, `<el-input>`) might be globally available without explicit imports. Always check existing code to see if explicit imports are required.

## 4. Error Handling & API Requests

- **Axios:** All API calls must go through the configured Axios instance in `src/utils/api.ts`. Do not import `axios` directly into components.
- **Error Feedback:** HTTP errors (401, 404, 500) are handled globally via Axios interceptors which dispatch `ElMessage.error` prompts.
- **Component Error Handling:** When making API calls inside components, wrap them in `try/catch` blocks if specific local error handling/fallback state is needed. Otherwise, rely on the global interceptor.
- **Loading States:** Always implement loading states (`const loading = ref(false)`) when fetching data to prevent double-submissions or layout shifts.

## 5. Development Workflow for Agents

1. **Analyze First:** Always use `read` or `glob` on existing `.ts` and `.vue` files within `src/` to confirm the local pattern before writing new code.
2. **Path Construction:** Always resolve absolute paths when interacting with the file system. Use `E:\codes\gitee\mica-mqtt-dashboard` as the base root.
3. **Run Checks:** After saving changes, proactively run `pnpm type-check && pnpm lint:check` via the `bash` tool to ensure your code did not introduce regressions.
4. **Iterative Fixes:** If linting or type-checking fails, read the output and fix the issues autonomously without asking the user for help.

## 6. Known AI Rules Integration

- No existing `.cursorrules` or Copilot instructions were found in this repository. These guidelines serve as the primary source of truth for all LLM coding agents.
