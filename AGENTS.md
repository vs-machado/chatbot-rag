# Agent Guidelines for chatbot-rag

## Project Structure

This is a monorepo with separate frontend and backend:
- `frontend/` - React + TypeScript + Vite application
- `backend/` - FastAPI Python application

When working on files, navigate to the appropriate directory first.

## Build/Lint/Testing Commands

### Frontend Commands (run from `frontend/` directory)
- `npm run dev` - Start Vite development server
- `npm run build` - TypeScript compile + Vite production build
- `npm run lint` - Run ESLint on all TS/TSX files
- `npm run preview` - Preview production build locally

### Backend Commands (run from `backend/` directory)
- `python main.py` - Start FastAPI development server (runs on port 8000)
- `uvicorn main:app --reload` - Alternative to start with auto-reload
- `pip install -r requirements.txt` - Install Python dependencies

### Running Individual Tests
No test framework is currently configured for either frontend or backend. Add test setup before writing tests.

## Code Style Guidelines

### TypeScript Configuration (Frontend)
- **Strict mode**: Enabled (noImplicitAny, strictNullChecks, etc.)
- **Target**: ES2022, modules: ESNext
- **Type checking**: `noUnusedLocals`, `noUnusedParameters` enabled
- **JSX**: react-jsx transform (no React import needed for JSX)
- **Path aliases**: Use `@/` for src directory imports (e.g., `@/components`, `@/lib/utils`)

### Python Style Guidelines (Backend)
- **PEP 8 compliant**: Follow Python style guide
- **Type hints**: Use type hints for function parameters and returns
- **Docstrings**: Use Google-style or NumPy-style docstrings in Brazilian Portuguese
- **Naming**:
  - Functions: snake_case (e.g., `get_messages`, `send_message`)
  - Classes: PascalCase (e.g., `MessageHandler`, `ChatService`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_TOKENS`, `API_TIMEOUT`)
  - Variables: Always use English (e.g., `user_name`, `is_loading`)

### Import Style
```typescript
// React imports first
import { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

// Third-party imports
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Relative/local imports
import './App.css'
```

### Component Structure
- Functional components with hooks
- Props interfaces: Use `interface ComponentProps { ... }` or type aliases
- Export default for main components: `export default function Component() {}`
- Use `export const` for utility functions and sub-components

### Error Handling
- **Frontend**: Use try/catch for async operations, type errors appropriately (never use `any`), leverage TypeScript strict mode
- **Backend**: Use try/except for error handling, return appropriate HTTP status codes, use Pydantic for validation
- Handle errors at appropriate boundaries (component level or service level)

### Naming Conventions (Frontend)
- **Components**: PascalCase (e.g., `ChatInterface`, `MessageList`)
- **Functions**: camelCase (e.g., `fetchMessages`, `sendMessage`)
- **Variables**: Always use English (e.g., `userName`, `isLoading`, `totalItems`)
- **Constants**: UPPER_SNAKE_CASE for global constants
- **Props interfaces**: PascalCase with Props suffix (e.g., `interface ButtonProps`)
- **Type aliases**: PascalCase (e.g., `type Message = {...}`)
- **CSS classes**: kebab-case for Tailwind, camelCase for CSS modules (if used)

### Code Documentation & Localization
- **Comments**: Always write code comments in Brazilian Portuguese (both frontend and backend)
  ```typescript
  // Busca mensagens do servidor
  const fetchMessages = async () => { ... }
  ```
  ```python
  # Busca mensagens do servidor
  def fetch_messages():
      pass
  ```
- **Colors**: Use Tailwind color classes instead of hardcoded hex values
  ```typescript
  // ✅ Good: use Tailwind colors
  <div className="bg-blue-500 text-white">

  // ❌ Bad: hardcoded colors
  <div style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}>
  ```

### Styling (Frontend)
- **Framework**: Tailwind CSS v4 with @tailwindcss/vite plugin
- **CSS variables**: Defined in src/index.css for theming
- **Utility**: Use `cn()` helper from `@/lib/utils` for class merging
- **shadcn/ui**: Pre-configured components in `@/components/ui` folder
- **Responsive**: Mobile-first approach with Tailwind breakpoints

### File Organization
```
frontend/
├── src/
│   ├── components/
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utilities (cn helper)
│   ├── hooks/            # Custom React hooks
│   ├── assets/           # Images, static files
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles + Tailwind imports
└── package.json

backend/
├── main.py               # FastAPI application entry point
├── requirements.txt      # Python dependencies
└── README.md
```

### React Best Practices
- Always use `React.StrictMode` in production builds (already in main.tsx)
- Use hooks rules: Only call at top level, only in React functions
- Use `useCallback` for functions passed to child props to prevent re-renders
- Use `useMemo` for expensive computations
- Clean up effects: Return cleanup function in useEffect when needed

### TypeScript Patterns
- Use `type` for unions/intersections, `interface` for object shapes
- Prefer `readonly` for immutable props
- Use `as const` for literal types: `const sizes = ['sm', 'md', 'lg'] as const`
- Type assertions: Use `as` sparingly, prefer type guards
- Generic functions: Properly constrain generics (e.g., `<T extends string>`)

### ESLint Rules (from eslint.config.js)
- React Hooks: `eslint-plugin-react-hooks` enabled
- React Refresh: For Fast Refresh in development
- TypeScript ESLint: Recommended rules applied
- No `any` types (caught by strict mode)
- No unused variables (locals and parameters)

### Before Submitting Code
**Frontend:**
1. Run `npm run lint` and fix all errors
2. Run `npm run build` to ensure TypeScript compiles without errors
3. Test in dev mode: `npm run dev`
4. Verify production build: `npm run build && npm run preview`
5. Ensure all imports use `@/` alias where appropriate
6. Check no unused imports or variables
7. Verify types are properly inferred (minimal explicit type assertions)

**Backend:**
1. Ensure code passes linting (use flake8 or similar)
2. Test the API endpoints
3. Run with `python main.py` and verify it starts correctly

### Saving OpenCode Session Logs
At the end of each OpenCode session, copy the conversation to save it to GitHub:

```bash
# Copia a sessão atual para o clipboard (use dentro do OpenCode)
/copy

# Example workflow
# 1. Execute /copy no OpenCode para copiar a sessão
# 2. Cole no arquivo de log e faça commit
vim logs/opencode/session-YYYY-MM-DD.md
git add logs/opencode/session-YYYY-MM-DD.md
git commit -m "docs: adiciona log de sessão do OpenCode"
```

- Creates `logs/opencode/` directory for session logs in markdown format
- Use `/copy` command inside OpenCode TUI to copy current session
- Saves as markdown for better readability and version control
- Commit logs to track development history and conversations
- Useful for debugging, documentation, and team collaboration

### Git Workflow
- This repository uses standard git workflow
- Branch from main/master for feature work
- Commit frequently with descriptive messages in Brazilian Portuguese
- Do not commit dist/, node_modules/, __pycache__/, .venv/
- AGENTS.md is for agent guidance only
