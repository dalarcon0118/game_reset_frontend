# Frontend

This is an Expo project.

## Prerequisites

- Node.js (Use the version specified in the project or a recent LTS)
- NPM or Yarn

## Running the project

**Do not use global `expo-cli` (e.g., `expo start`). It is deprecated.**

Instead, use the local scripts:

### Development

To start the development server with tunneling (useful for testing on physical devices):

```bash
npm run dev -- --tunnel --clear
```

Or simply:

```bash
npm start -- --tunnel --clear
```

### Scripts

- `npm run dev`: Starts the Expo development server (with telemetry disabled).
- `npm start`: Alias for `expo start`.
- `npm run build:web`: Builds the project for web.
- `npm run lint`: Runs linter.
