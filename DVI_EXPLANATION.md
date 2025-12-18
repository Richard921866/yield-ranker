# DVI (Dividend Volatility Index) Explanation

## Time Period Used

**DVI uses a 12-month (365 days) period by default.**

The calculation looks at all dividend payments within the last 365 days from today and calculates:
- Standard Deviation (SD) of annualized dividend amounts
- Median of annualized dividend amounts
- Coefficient of Variation (CV) = SD / Median
- DVI is displayed as a percentage (CV × 100)

## Is It Changeable?

**Yes, but currently hardcoded to 12 months.**

The `calculateDividendVolatility` function in `server/src/services/metrics.ts` accepts a `periodInMonths` parameter that can be either `6` or `12`:

```typescript
export function calculateDividendVolatility(
  dividends: DividendRecord[],
  periodInMonths: 6 | 12 = 12,  // Default is 12 months
  ticker?: string
): DividendVolatilityResult
```

Currently, all calls to this function use `12` months (365 days). To change to 6 months, you would need to modify the call in `calculateMetrics`:

```typescript
// Current (12 months):
const volMetrics = calculateDividendVolatility(dividends, 12, upperTicker);

// To use 6 months instead:
const volMetrics = calculateDividendVolatility(dividends, 6, upperTicker);
```

## How It Works

1. **Collects dividends** from the last 365 days (or 180 days if 6 months)
2. **Annualizes each dividend** by multiplying by frequency (weekly=52, monthly=12, quarterly=4, etc.)
3. **Calculates Standard Deviation** of all annualized amounts (sample SD, not population)
4. **Calculates Median** of all annualized amounts
5. **Calculates CV** = SD / Median (NOT SD / Mean)
6. **Displays as percentage** = CV × 100

## Why 12 Months?

- Provides a full year of dividend history
- Captures seasonal patterns
- Balances between too short (noisy) and too long (stale)
- Industry standard for volatility calculations

## Recommendation

Keep it at 12 months for consistency and accuracy. If you need 6 months for specific analysis, it can be changed but should be consistent across all calculations.

