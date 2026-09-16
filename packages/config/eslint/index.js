// Shared ESLint config. Enforces CLAUDE.md §3: a service never imports from
// another service's source tree. Do not weaken or disable this rule.
//
// Uses import/no-restricted-paths (resolves imports to real file paths)
// rather than no-restricted-imports (string-pattern matching), because a
// relative cross-service import like '../../auth/src/app.module' never
// contains the literal substring 'services/' and so cannot be caught by a
// glob pattern applied to the import string.
//
// The list of forbidden "from" directories is computed at lint time as
// "every sibling service's src/, excluding this service's own" — this
// service's directory name is read from process.cwd(), which is the
// service root because each service's `lint` script runs `eslint src`
// from its own directory.
const fs = require('fs');
const path = require('path');

const servicesRoot = path.resolve(process.cwd(), '..');
const currentService = path.basename(process.cwd());
const otherServiceSrcDirs = fs
  .readdirSync(servicesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== currentService)
  .map((entry) => `../${entry.name}/src`);

module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { node: true },
  settings: {
    'import/resolver': { typescript: true },
  },
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        basePath: process.cwd(),
        zones: [
          {
            target: './src',
            from: otherServiceSrcDirs,
            message:
              'Cross-service imports are forbidden (CLAUDE.md §3). Move shared code to packages/.',
          },
        ],
      },
    ],
  },
};
