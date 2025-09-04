
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)?(?:\(([^)]+)\))?: (.+?) \((.+)\)$/,
      headerCorrespondence: ['type', 'scope', 'subject', 'references'],
    },
  },
  rules: {
    'header-max-length': [2, 'always', 200],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'references-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    'scope-empty': [2, 'never'], 
    'subject-empty': [2, 'never'],
    'subject-min-length': [2, 'always', 5],
    'subject-max-length': [2, 'always', 75],
  },
};
