// Test file with linting errors that should fail
const badCode = 'test';
// Missing semicolon and other issues
function badFunction() {
  const unused = 'this will cause linting error';
  return undefined;
}

// This should cause TypeScript errors
const wrongType: number = 'string';
