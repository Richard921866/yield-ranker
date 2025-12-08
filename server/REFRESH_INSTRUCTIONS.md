# Data Refresh Instructions

## Complete Data Refresh

To refresh all data, calculations, and metrics for all ETFs:

```bash
cd server
npm run refresh:all
```

This will:
1. **Force re-download** prices and dividends from the last 365 days (extended lookback for split adjustments)
2. **Recalculate all metrics** including:
   - Annual dividends (using adjusted amounts)
   - DVI (Dividend Volatility Index) using average method
   - Total returns (DRIP and price returns)
   - All time periods (1W, 1M, 3M, 6M, 1Y, 3Y)
3. **Verify data integrity** and show summary

## Refresh Specific Tickers (e.g., for Reverse Splits)

For tickers that had reverse splits (like AMDY, PYPY), refresh them specifically:

```bash
cd server
npm run refresh:ticker AMDY
npm run refresh:ticker PYPY
```

Or use the full command:
```bash
npx tsx scripts/refresh_all.ts --ticker AMDY
npx tsx scripts/refresh_all.ts --ticker PYPY
```

## Dry Run (Preview Changes)

To see what would be done without making changes:

```bash
cd server
npm run refresh:all -- --dry-run
npm run refresh:ticker AMDY -- --dry-run
```

## Other Available Commands

### Daily Update (Incremental)
```bash
npm run daily:update          # Incremental update
npm run daily:update:force    # Force update from last 60 days
```

### Recalculate Metrics Only (No API Calls)
```bash
npm run recalc:metrics        # Recalculate from existing data
```

### Hourly Sync (Lightweight)
```bash
npm run cron:hourly           # Quick sync for recent changes
```

## Important Notes

1. **Split Adjustments**: The `refresh_all` script fetches 365 days of dividend history to ensure split-adjusted amounts (`adj_amount`) are properly captured for reverse splits.

2. **API Rate Limits**: Be mindful of Tiingo API rate limits when refreshing all tickers. The script processes tickers sequentially to avoid rate limit issues.

3. **Verification**: After running the refresh, check the website to verify:
   - Annual dividend totals are correct
   - DVI values are showing
   - Split-adjusted dividends are displayed correctly
   - Charts are rendering properly

## Troubleshooting

If a specific ticker fails:
1. Check the error message in the console
2. Try refreshing just that ticker: `npm run refresh:ticker TICKER`
3. Verify the ticker exists in the database
4. Check Tiingo API status: `npm run tiingo:test`

