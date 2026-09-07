export function normalizeReadingMode(mode) {
  return mode === 'deep' || mode === 'adept' ? 'adept' : 'inquirer';
}
