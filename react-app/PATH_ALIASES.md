# Path Aliases Migration Guide

This guide explains how to use path aliases in the project and how to migrate existing code to use these aliases.

## What are Path Aliases?

Path aliases are shortcuts that make import statements cleaner and more maintainable. Instead of using relative paths like:

```typescript
import { SomeComponent } from '../../../components/SomeComponent';
```

You can use aliases:

```typescript
import { SomeComponent } from '@components/SomeComponent';
```

## Configured Aliases

The following aliases have been configured:

| Alias                  | Path                      |
|------------------------|---------------------------|
| `@components/*`        | `src/components/*`        |
| `@components/BidPage/*`| `src/components/BidPage/*`|
| `@components/shared/*` | `src/components/shared/*` |
| `@hooks/*`             | `src/hooks/*`             |
| `@utils/*`             | `src/utils/*`             |
| `@services/*`          | `src/services/*`          |
| `@types`               | `src/types`               |
| `@types/*`             | `src/types/*`             |
| `@constants/*`         | `src/constants/*`         |
| `@pages/*`             | `src/pages/*`             |
| `@assets/*`            | `src/assets/*`            |
| `@styles/*`            | `src/styles/*`            |
| `@context/*`           | `src/context/*`           |
| `@store`               | `src/store`               |
| `@store/*`             | `src/store/*`             |

## How to Migrate

### Automatic Migration

We've included a script to automatically update most import statements to use path aliases:

```bash
npm run migrate-aliases
```

This script will:
1. Scan all TypeScript and TSX files in the `src` directory
2. Convert relative imports to use path aliases where possible
3. Report which files were updated

### Manual Adjustments

You might need to make manual adjustments in these cases:
- Dynamic imports that use template strings
- Imports in non-TypeScript files
- Imports that couldn't be automatically resolved
- Imports in newly created files

### Example Conversions

**Before:**
```typescript
// In src/pages/BidPage.tsx
import BidHistoryTable from '../components/BidHistoryTable';
import { useAuctionData } from '../hooks/useAuctionData';
import { formatCurrency } from '../utils/formatUtils';
```

**After:**
```typescript
// In src/pages/BidPage.tsx
import BidHistoryTable from '@components/BidHistoryTable';
import { useAuctionData } from '@hooks/useAuctionData';
import { formatCurrency } from '@utils/formatUtils';
```

## Technical Implementation

This feature is implemented using:
1. CRACO (Create React App Configuration Override) for webpack configuration
2. TypeScript path mapping in `tsconfig.json`
3. A custom migration script in `scripts/migrateToAliases.js`

## Troubleshooting

If you encounter any issues:

1. **IDE doesn't recognize aliases:**
   Restart your IDE or reload the TypeScript server.

2. **Build errors:**
   Make sure you've installed CRACO with `npm install @craco/craco`.

3. **Migration script errors:**
   Install the required packages:
   ```bash
   npm install glob
   ```

4. **Runtime import errors:**
   Check that the path in the alias is correct and that the file exists at that location.
