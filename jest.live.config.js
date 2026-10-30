// Live OpenRouter tests run in plain Node so the real (native) fetch is used.
// The default `npm test` config (jest-expo) swaps fetch for React Native's polyfill.
// Run with: npm run test:live
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/live'],
  // Plain Babel (no Expo bundler context): strip TS/JSX and convert ESM to CommonJS.
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [['@babel/preset-typescript', { isTSX: true, allExtensions: true }]],
        plugins: [['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }], '@babel/plugin-transform-modules-commonjs'],
      },
    ],
  },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testTimeout: 15 * 60 * 1000,
};
