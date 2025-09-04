module.exports = {
    extends: ['@commitlint/config-conventional'],
    parserPreset: {
      parserOpts: {
        // type(scope?): subject (#123)
        headerPattern: /^(\w+)(?:\(([^)]+)\))?: (.+) \(#(\d+)\)$/,
        headerCorrespondence: ['type', 'scope', 'subject', 'issue'],
      },
    },
    rules: {
      'header-max-length': [2, 'always', 72],
      'subject-case': [
        2,
        'never',
        ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
      ],
      'references-empty': [2, 'never'], // ensures (#123) is required
    },
  };
  


