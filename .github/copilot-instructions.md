# AI Assistant Instructions

## Communication Guidelines

### Clarifying Questions
Before implementing any request, ask all necessary clarifying questions to fully understand the requirements. Do not make assumptions about:
- File names or locations
- Implementation details
- User preferences
- Scope of changes

**Wait for explicit confirmation and answers to all clarifying questions before proceeding with any work. If the user indicates they cannot or do not want to answer a specific question, proceed accordingly and note this in your process.**

## Project Context

This is a React + TypeScript project using:
- Vite for build tooling
- Redux Toolkit for state management
- Firebase for backend services (Auth & Firestore)
- CSS Modules for styling

## Code Style Preferences

### State Management
- Use Redux Toolkit slices for feature-level state
- Create thunk actions when an action needs to dispatch multiple actions or handle side effects
- Keep actions simple and composable
- Each feature should manage its own state when possible

### File Organization
- Follow the existing feature-based structure under `src/features/`
- Each feature should have its own `slice.ts` for Redux state
- Co-locate component styles in `style.module.css` files
- Keep components focused and single-responsibility

### TypeScript
- Use explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Avoid using `any` - use proper typing

### React
- Use functional components with hooks
- Keep component logic readable and maintainable
- Extract complex logic into custom hooks when appropriate

## Code Commenting
- Avoid obvious comments that simply restate what the code does or explain standard language or CSS properties.
- Comments should describe the purpose or behavior of code, not its structural role (e.g., avoid 'helper function' or 'utility function' comments).

## Before Making Changes

1. Ask clarifying questions if the request is ambiguous
2. Read relevant existing code to understand current patterns
3. Follow established conventions in the codebase
4. Validate changes by checking for errors after editing
5. Ensure the build succeeds after making changes
