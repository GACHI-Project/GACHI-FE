module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'airbnb',
    'airbnb/hooks',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'react-native', 'prettier'],
  rules: {
    'prettier/prettier': 'error',

    'react/react-in-jsx-scope': 'off',
    'react/jsx-filename-extension': ['warn', { extensions: ['.tsx', '.jsx'] }],

    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-use-before-define': ['error', { variables: false }],
    'no-use-before-define': 'off',

    'react/require-default-props': 'off',
    'react/prop-types': 'off',

    'import/extensions': ['error', 'ignorePackages', { ts: 'never', tsx: 'never' }],
    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',

    'react/function-component-definition': ['error', { namedComponents: 'arrow-function' }],

    'react-native/no-color-literals': 'off',
    'react-native/sort-styles': 'off',
    'react-native/no-inline-styles': 'warn',

    'react/style-prop-object': 'off',

    'no-void': 'off',
    'global-require': 'off',
    '@typescript-eslint/no-require-imports': 'off',
  },
  settings: {
    'import/resolver': {
      node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
    },
  },
  env: {
    browser: true,
    es2021: true,
    'react-native/react-native': true,
  },
};
