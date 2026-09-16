module.exports = {
  root: true,
  extends: ['../../packages/config/eslint/index.js'],
  env: { node: true, jest: true },
  ignorePatterns: ['dist', 'node_modules'],
};
