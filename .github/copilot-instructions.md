# AI Assistant Instructions

## Communication Guidelines

### Clarifying Questions

Before implementing any request, ask all necessary clarifying questions to fully understand the requirements. Do not
make assumptions about:

- File names or locations
- Implementation details
- User preferences
- Scope of changes

**Wait for explicit confirmation and answers to all clarifying questions before proceeding with any work. If the user
indicates they cannot or do not want to answer a specific question, proceed accordingly and note this in your process.**

### Before Making Changes

1. Ask clarifying questions if the request is ambiguous
2. Read relevant existing code to understand current patterns
3. Follow established conventions in the codebase
4. Validate changes by checking for errors after editing
5. Ensure the build succeeds after making changes

## Project Context

This is a React + TypeScript project using:

- Vite for build tooling
- Redux Toolkit for state management
- Firebase for backend services (Auth & Firestore)
- CSS Modules for styling

### State Management

- Use Redux Toolkit slices for feature-level state
- Create thunk actions when an action needs to dispatch multiple actions or handle side effects
- Keep actions simple and composable
- Each feature should manage its own state when possible

### File Organization

- Follow the existing feature-based structure under `src/features/`
  - app: Main application shell and routing
  - auth: User authentication flows
  - compose: Edit a single puzzle
  - compose-list: List of user-created puzzles
  - play: Play a puzzle
  - play-list: List of available puzzles to play
- Each feature has its own `slice.ts` for Redux state and related logic
- Each feature has its own `style.module.css` for CSS
- Keep components focused and single-responsibility
- Put shared components, utilities, types and styles in src/common

### TypeScript

- Use explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Avoid using `any` - use proper typing

### React

- Use functional components with hooks
- Keep component logic readable and maintainable
- Extract complex logic into custom hooks when appropriate

## Code Commenting: see .github/comment-style.md

## Markdown File Guidelines: see .github/markdown-style.md
