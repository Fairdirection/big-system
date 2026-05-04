# 📄 scripts-and-tools.md
# SalesFlow Frontend — Scripts & Tooling

---

## `package.json` — npm Scripts

```json
{
  "name": "salesflow-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev":          "ng serve --configuration=development --proxy-config proxy.conf.json --open",
    "build":        "ng build --configuration=production",
    "build:dev":    "ng build --configuration=development",
    "preview":      "npx serve dist/salesflow-frontend/browser -p 4201",
    "test":         "ng test --watch=false --browsers=ChromeHeadless",
    "lint":         "ng lint",
    "lint:fix":     "ng lint --fix",
    "format":       "prettier --write \"src/**/*.{ts,html,css,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,html,css,json}\"",
    "analyze":      "ng build --stats-json && npx webpack-bundle-analyzer dist/salesflow-frontend/browser/stats.json",
    "typecheck":    "tsc --noEmit"
  },
  "dependencies": {
    "@angular/animations": "^19.0.0",
    "@angular/cdk": "^19.0.0",
    "@angular/common": "^19.0.0",
    "@angular/compiler": "^19.0.0",
    "@angular/core": "^19.0.0",
    "@angular/forms": "^19.0.0",
    "@angular/platform-browser": "^19.0.0",
    "@angular/router": "^19.0.0",
    "@ng-icons/core": "^29.0.0",
    "@ng-icons/heroicons": "^29.0.0",
    "chart.js": "^4.4.0",
    "date-fns": "^3.6.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^19.0.0",
    "@angular/cli": "^19.0.0",
    "@angular/compiler-cli": "^19.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "postcss": "^8.4.0",
    "prettier": "^3.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "~5.6.0",
    "webpack-bundle-analyzer": "^4.10.0"
  }
}
```

---

## ESLint Configuration

Create `eslint.config.js` at project root (ESLint v9 flat config):

```js
// eslint.config.js
const tseslint = require('typescript-eslint');
const prettier = require('eslint-config-prettier');
const pluginPrettier = require('eslint-plugin-prettier');

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', '.angular/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      ...tseslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.app.json'],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      // Angular-specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Enforce signal patterns
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'NewExpression[callee.name="BehaviorSubject"]',
          message: 'Prefer Angular Signals over BehaviorSubject for local state.',
        },
      ],

      // Prettier integration
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.html'],
    rules: {
      // HTML template rules can be added here
    },
  },
  prettier
);
```

---

## Prettier Configuration

Create `.prettierrc` at project root:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf",
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "printWidth": 120,
        "parser": "angular"
      }
    }
  ]
}
```

Create `.prettierignore`:

```
dist/
.angular/
node_modules/
*.json
```

---

## EditorConfig

Create `.editorconfig` at project root:

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

---

## Git Hooks with Husky (Optional but Recommended)

```bash
npm install -D husky lint-staged
npx husky init
```

Add `.husky/pre-commit`:

```sh
#!/bin/sh
npx lint-staged
```

Add to `package.json`:

```json
{
  "lint-staged": {
    "src/**/*.ts": [
      "eslint --fix",
      "prettier --write"
    ],
    "src/**/*.html": [
      "prettier --write"
    ],
    "src/**/*.css": [
      "prettier --write"
    ]
  }
}
```

---

## VS Code Workspace Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "project-relative",
  "tailwindCSS.experimental.classRegex": [
    ["[cC]lass[nN]ame\\s*=\\s*['\"]([^'\"]*)['\"]", 1],
    ["[cC]lass[nN]ame\\s*=\\s*\\{([^}]*)\\}", 1]
  ],
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "angular.enable-strict-mode-prompt": false
}
```

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "angular.ng-template",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

---

## Script Reference

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Dev server with proxy + hot reload |
| `build` | `npm run build` | Production build (optimized, purged CSS) |
| `build:dev` | `npm run build:dev` | Development build with source maps |
| `preview` | `npm run preview` | Serve production build locally on :4201 |
| `test` | `npm run test` | Run unit tests (headless Chrome) |
| `lint` | `npm run lint` | ESLint check |
| `lint:fix` | `npm run lint:fix` | ESLint auto-fix |
| `format` | `npm run format` | Prettier format all source files |
| `format:check` | `npm run format:check` | Check formatting (CI use) |
| `analyze` | `npm run analyze` | Bundle analyzer — identify large chunks |
| `typecheck` | `npm run typecheck` | TypeScript strict check without building |
