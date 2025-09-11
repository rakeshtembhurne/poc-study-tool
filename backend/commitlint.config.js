module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      // Make the header pattern more flexible to avoid false errors
      headerPattern: /^(\w+)(?:\(([^)]*)\))?: (.+)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
      // Enable multi-line parsing for body support
      issuePrefixes: ['#'],
      noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES'],
      fieldPattern: /^-(.*?)-$/,
      revertPattern: /^Revert\s"([\s\S]*)"\s*This reverts commit (\w*)\./,
      revertCorrespondence: ['header', 'hash'],
      warn: false,
      mergePattern: null,
      mergeCorrespondence: null,
    },
  },
  rules: {
    'header-max-length': [2, 'always', 200],
    'body-max-line-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'], // Warning only
    'footer-leading-blank': [0], // Disabled - footer is optional
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'type-empty': [2, 'never'],
    'scope-empty': [0], // Allow empty scope
    'subject-empty': [2, 'never'],
    'subject-min-length': [2, 'always', 5],
    'subject-max-length': [2, 'always', 75],
    'subject-full-stop': [2, 'never', '.'],
  },

  // Custom plugin for GitHub issue validation with better messages
  plugins: [
    {
      rules: {
        'github-issue-format': (parsed, _when, _value) => {
          const { header } = parsed;
          const issuePattern = /\s+#\d+(?:,\s*#\d+)*$/;

          if (!issuePattern.test(header)) {
            return [
              false,
              `Missing GitHub issue reference.
      Format: type(scope): subject #123
      Example: feat(config): improve commit message validation and documentation #123`,
            ];
          }
          return [true];
        },
      },
    },
  ],

  // Apply the custom rule
  rules: {
    'header-max-length': [2, 'always', 200],
    'body-max-line-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [0], // Disabled
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'type-empty': [2, 'never'],
    'scope-empty': [0],
    'subject-empty': [2, 'never'],
    'subject-min-length': [2, 'always', 5],
    'subject-max-length': [2, 'always', 75],
    'subject-full-stop': [2, 'never', '.'],
    'github-issue-format': [2, 'always'],
  },

  helpUrl:
    'https://github.com/your-org/repo/blob/main/README.md#commit-message-guidelines',
  defaultIgnores: true,
};
