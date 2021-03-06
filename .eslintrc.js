module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ['standard'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    semi: [2, 'always'],
    'comma-dangle': 0,
    quotes: [2, 'single', { allowTemplateLiterals: true }]
  },
};
