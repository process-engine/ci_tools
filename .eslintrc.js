module.exports = {
  extends: [],
  env: {
    node: true,
    mocha: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    // error - these rules are breaking builds

    'arrow-parens': ['error', 'always'],
    curly: ['error', 'all'],
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
    'newline-per-chained-call': ['error', { ignoreChainWithDepth: 2 }],
    'no-multiple-empty-lines': ['error', { max: 1, maxBOF: 0 }],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.'
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.'
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.'
      }
    ],
    'no-underscore-dangle': ['warn', { allowAfterThis: true }],
    radix: ['error', 'as-needed'],

    '@typescript-eslint/array-type': ['error', { default: 'array' }],
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          Object: 'Use object instead.',
          String: "Use 'string' instead.",
          Number: "Use 'number' instead.",
          Boolean: "Use 'boolean' instead."
        }
      }
    ],
    '@typescript-eslint/generic-type-naming': ['error', '^T([A-Z][a-zA-Z]+|)$'],
    '@typescript-eslint/interface-name-prefix': ['error', 'always'],
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'semi',
          requireLast: true
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false
        }
      }
    ],
    '@typescript-eslint/member-naming': [
      'error',
      {
        private: '^([A-Z]+|[a-z])',
        protected: '^([A-Z]+|[a-z])',
        public: '^([A-Z]+|[a-z])'
      }
    ],
    '@typescript-eslint/no-array-constructor': ['error'],
    '@typescript-eslint/no-empty-interface': ['error'],
    '@typescript-eslint/no-inferrable-types': ['error', { ignoreParameters: true, ignoreProperties: true }],
    '@typescript-eslint/no-misused-new': ['error'],
    '@typescript-eslint/no-parameter-properties': ['error'],
    '@typescript-eslint/no-this-alias': ['error'],
    '@typescript-eslint/prefer-for-of': ['error'],
    '@typescript-eslint/prefer-function-type': ['error'],
    '@typescript-eslint/type-annotation-spacing': ['error'],
    '@typescript-eslint/typedef': [
      'error',
      {
        arrayDestructuring: false,
        arrowParameter: false,
        memberVariableDeclaration: false,
        objectDestructuring: false,
        parameter: false,
        propertyDeclaration: true,
        variableDeclaration: false
      }
    ],

    'sort-imports': ['warn', { ignoreDeclarationSort: true }],
    '@typescript-eslint/adjacent-overload-signatures': ['warn'],
    '@typescript-eslint/ban-ts-ignore': ['warn'],
    '@typescript-eslint/camelcase': ['warn', { properties: 'never', allow: ['^[A-Z]'] }],
    '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
    '@typescript-eslint/no-extraneous-class': ['warn'],
    '@typescript-eslint/no-non-null-assertion': ['warn'],
    '@typescript-eslint/no-useless-constructor': ['warn'],
    '@typescript-eslint/member-ordering': [
      'warn',
      {
        default: [
          // Fields
          'public-static-field',
          'protected-static-field',
          'private-static-field',
          'public-instance-field',
          'protected-instance-field',
          'private-instance-field',

          'public-field',
          'protected-field',
          'private-field',
          'static-field',
          'instance-field',
          'field',

          'constructor',

          'static-method',
          'instance-method'
        ]
      }
    ],

    // off - these rules are either covered by Prettier or simply don't help
    '@typescript-eslint/explicit-function-return-type': ['off'],
    '@typescript-eslint/class-name-casing': ['off'],
    '@typescript-eslint/consistent-type-assertions': ['off'],
    '@typescript-eslint/consistent-type-definitions': ['off'],
    '@typescript-eslint/explicit-member-accessibility': ['off'],
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/no-explicit-any': ['off'],
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-for-in-array': 'off',
    '@typescript-eslint/no-magic-numbers': ['off'],
    '@typescript-eslint/no-namespace': ['off'],
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-type-alias': 'off',
    '@typescript-eslint/no-unnecessary-qualifier': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/no-use-before-define': ['off'],
    '@typescript-eslint/no-var-requires': ['off'],
    '@typescript-eslint/prefer-includes': 'off',
    '@typescript-eslint/prefer-interface': ['off'],
    '@typescript-eslint/prefer-namespace-keyword': 'off',
    '@typescript-eslint/prefer-regexp-exec': 'off',
    '@typescript-eslint/prefer-string-starts-ends-with': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/triple-slash-reference': ['off'],
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/unified-signatures': ['off'],
    'arrow-body-style': ['off'],
    'class-methods-use-this': ['off'],
    'function-paren-newline': ['off'],
    'implicit-arrow-linebreak': ['off'],
    'import/no-extraneous-dependencies': ['off'],
    'import/prefer-default-export': 'off',
    'max-classes-per-file': ['off'],
    'max-len': 'off',
    'max-lines': 'off',
    'new-cap': 'off',
    'no-async-promise-executor': ['off'],
    'no-await-in-loop': ['off'],
    'no-bitwise': ['off'],
    'no-case-declarations': ['off'],
    'no-confusing-arrow': ['off'],
    'no-continue': ['off'],
    'no-magic-numbers': 'off',
    'no-new-func': ['off'],
    'no-null/no-null': ['off'],
    'no-param-reassign': ['off'],
    'no-plusplus': ['off'],
    'no-unused-vars': 'off',
    'no-use-before-define': ['off'],
    'no-useless-constructor': ['off'],
    'no-void': ['off'],
    'nonblock-statement-body-position': ['off'],
    'object-curly-spacing': ['off'],
    'object-shorthand': ['off'],
    'operator-linebreak': ['off'],
    'padded-blocks': ['off'],
    'prefer-destructuring': ['off'],
    'prefer-object-spread': ['off'],
    'require-await': ['off'],
    camelcase: 'off',
    complexity: ['off'],
    eqeqeq: ['off'],
    indent: 'off',
    strict: 'off'
  },
  // make eslint recognize typescript files
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts']
      }
    }
  }
};
