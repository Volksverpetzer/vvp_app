# GitHub Copilot Instructions for Volksverpetzer App

This repository contains the official React Native mobile app for Volksverpetzer, built with Expo.

## Technology Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript (with relaxed strict mode)
- **Package Manager**: pnpm (v10.26.0)
- **Testing**: Jest with jest-expo preset
- **Routing**: expo-router
- **State Management**: React hooks and context
- **UI**: Native components with custom design system

## Code Style and Conventions

### General Guidelines

- Use **arrow functions** for named React components (enforced by ESLint)
- Use **2 spaces** for indentation (defined in .editorconfig)
- Follow Prettier formatting with sorted imports (@trivago/prettier-plugin-sort-imports)
- Run `pnpm lint:fix` to automatically fix linting issues
- Use TypeScript for all new files (.ts or .tsx extensions)

### Import Order

Imports are automatically sorted by Prettier with this order:

1. Core imports (`@core/`)
2. Server imports (`@server/`)
3. UI imports (`@ui/`)
4. Relative imports (`./` or `../`)

### Naming Conventions

- **Components**: PascalCase (e.g., `SteadyButton`, `MissionPopup`)
- **Files**: Match component name for components, camelCase for utilities
- **Functions**: camelCase (e.g., `normalizeFacets`, `registerEvent`)
- **Constants**: PascalCase for config objects, UPPER_SNAKE_CASE for true constants

### Component Structure

```tsx
import { /* native imports */ } from "react-native";
import { /* expo imports */ } from "expo-*";

import { /* local imports */ } from "../../";

interface ComponentNameProperties {
  prop1: string;
  prop2?: number;
}

/**
 * Component description with JSDoc
 * @param prop1 - Description of prop1
 * @param prop2 - Description of prop2
 */
const ComponentName = (properties: ComponentNameProperties) => {
  // Component logic
  return (
    // JSX
  );
};

export default ComponentName;
```

## Project Structure

```
src/
├── app/              # Expo Router app directory
├── components/       # Reusable UI components
│   ├── animations/
│   ├── bars/
│   ├── buttons/
│   ├── counter/
│   ├── design/
│   ├── popups/
│   ├── posts/
│   ├── typography/
│   └── views/
├── constants/        # App configuration and constants
├── helpers/          # Utility functions and business logic
│   ├── Networking/   # API and analytics
│   └── utils/        # General utilities
├── hooks/            # Custom React hooks
├── screens/          # Full screen components
└── types/            # TypeScript type definitions

__tests__/            # Jest test files (mirrors src/ structure)
config/               # App-specific configurations (VVP vs Mimikama)
plugins/              # Custom Expo config plugins
```

## Development Workflow

### Building and Running

```bash
# Install dependencies
pnpm install

# Start development server
pnpm start

# Run on specific platform
pnpm android
pnpm ios
pnpm web
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test -- path/to/test.test.ts
```

### Code Quality

```bash
# Type checking
pnpm check:ts

# Spell checking
pnpm check:spelling

# Run all checks
pnpm check

# Lint code
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

## Testing Guidelines

- Place tests in `__tests__/` directory mirroring the `src/` structure
- Use `.test.ts` or `.test.tsx` extensions
- Use `@testing-library/react-native` for component testing
- Mock external dependencies appropriately (see `__tests__/mocks/`)
- Follow existing test patterns in the repository

Example test structure:

```typescript
import { describe, expect, it } from "@jest/globals";

describe("ComponentName", () => {
  it("should do something", () => {
    // Arrange
    // Act
    // Assert
    expect(result).toBe(expected);
  });
});
```

## API and Data Fetching

- Helper functions for fetching are in `src/helpers/`
- Analytics functions are in `src/helpers/Networking/Analytics`
- Feed fetchers (WordPress, Instagram, TikTok, YouTube, Bluesky, etc.) are in `src/helpers/fetchers/`
- All fetchers return normalized Post objects

## Security

- **Gitleaks** is configured to prevent secret commits
- Never commit API keys, tokens, or sensitive credentials
- Use environment variables for configuration
- The CI pipeline includes security checks

## Multi-App Configuration

This repository supports two app variants:

- **Volksverpetzer** (default): `APP=volksverpetzer`
- **Mimikama**: `APP=mimikama`

Configuration files are in `config/` directory and are selected based on `APP` environment variable.

## Common Tasks

### Adding a New Component

1. Create component file in appropriate `src/components/` subdirectory
2. Use arrow function syntax with TypeScript interface for props
3. Add JSDoc comments describing the component
4. Export as default
5. Add tests in `__tests__/components/` if needed

### Adding a New Screen

1. Create screen in `src/screens/` or use expo-router in `src/app/`
2. Follow existing screen patterns
3. Register route if needed (expo-router handles this automatically)

### Adding Dependencies

1. Use `pnpm add <package>` for production dependencies
2. Use `pnpm add -D <package>` for dev dependencies
3. Check compatibility with React Native and Expo
4. Run `pnpm expo:check` to verify Expo compatibility

## CI/CD

The project uses GitHub Actions:

- **check-test-and-lint.yml**: Runs on every push, executes type checking, spell checking, tests, and linting
- Type checking continues on error (TODO: fix all TypeScript issues)
- Gitleaks scans for secrets
- Expo builds are automated for releases

## Important Notes

- TypeScript strict mode is **disabled** (`"strict": false`)
- Some TypeScript errors are allowed in CI (continue-on-error: true)
- Use `--no-pager` with git commands to avoid interactive output
- The app supports both light and dark mode (`userInterfaceStyle: "automatic"`)
- Haptic feedback is used throughout the app (expo-haptics)

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [expo-router Documentation](https://docs.expo.dev/router/introduction/)

## Getting Help

- Check existing code patterns before implementing new features
- Review test files for examples of how to test specific functionality
- Consult the README.md for development setup instructions
- Important files are documented in the German section of README.md
