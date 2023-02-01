module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
    },
    extends: [
        'airbnb-base',
    ],
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        indent: ['error', 4],
        semi: ['warn', 'never'],
        'object-curly-newline': ['warn', {
            ObjectExpression: 'always',
            ObjectPattern: {
                multiline: true,
            },
            ImportDeclaration: 'never',
            ExportDeclaration: {
                multiline: true, minProperties: 3,
            },
        }],
        'consistent-return': [0],
        'prefer-const': [0],
        'no-unused-vars': [0],
        'no-console': [0],
        'global-require': [0],
        'no-plusplus': [0],
        'no-underscore-dangle': [0],
        'import/no-dynamic-require': [0],
        'no-shadow': ['warn'],
        'no-restricted-syntax': ['warn'],
        'max-len': ['warn'],
		'linebreak-style': [0]
    },
}
