export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'theme',
          'apply',
          'layer',
          'utility',
          'variant',
          'custom-variant',
          'source',
          'plugin',
          'config',
        ],
      },
    ],
    'import-notation': 'string',
  },
};
