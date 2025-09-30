module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 80,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  jsxSingleQuote: true,
  bracketSameLine: false,
  embeddedLanguageFormatting: 'auto',
  insertPragma: false,
  proseWrap: 'preserve',
  quoteProps: 'as-needed',
  requirePragma: false,
  useTabs: false,
  vueIndentScriptAndStyle: false,
  overrides: [
    {
      files: ['*.json'],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ['*.md'],
      options: {
        proseWrap: 'always',
      },
    },
  ],
};