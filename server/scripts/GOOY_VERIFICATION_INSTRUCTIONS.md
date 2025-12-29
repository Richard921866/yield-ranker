# GOOY Normalization Verification Instructions for Gemini

## How to Run the Verification Script

```bash
cd server
npm run verify:gooy
```

Or directly:
```bash
npx tsx server/scripts/verify_gooy_normalization.ts
```

## What the Script Does

This script fetches all GOOY dividend data from the database and displays a complete calculation breakdown matching your spreadsheet format.

## Expected Output Format

The script will show a table with these columns:
- **DATE**: Ex-dividend date (YYYY-MM-DD)
- **DIVIDEND**: Raw dividend amount (div_cash)
- **ADJ DIV**: Split-adjusted dividend amount (adj_amount)
- **DAYS**: Days since previous dividend (null for first dividend)
- **TYPE**: Regular, Special, or Initial
- **FREQ**: Frequency number (52=weekly, 12=monthly, 4=quarterly)
- **ANNLZD**: Annualized amount (ADJ_DIV × FREQ, only for Regular)
- **NORMALZD**: Normalized amount (ANNLZD / 52, only for Regular)

## Calculation Rules

1. **DAYS**: Current ex_date - Previous ex_date
2. **TYPE**:
   - null days → "Initial"
   - ≤5 days → "Special"
   - >5 days → "Regular"
3. **FREQUENCY (Backward Confirmation)**:
   - Look AHEAD to next dividend to confirm frequency of current dividend
   - 7-10 days → 52 (Weekly)
   - 25-35 days → 12 (Monthly)
   - 80-100 days → 4 (Quarterly)
   - 6 days → 52 (Weekly)
   - 11-24 days → 12 (Monthly)
   - Only last dividend uses gap from previous
4. **ANNUALIZED**: ADJ_DIV × FREQ (Regular dividends only)
5. **NORMALIZED**: ANNLZD / 52 (Regular dividends only)

## What to Check

1. Are the DAYS calculations correct?
2. Are TYPE classifications correct (≤5 days = Special)?
3. Is FREQUENCY being determined by looking ahead to next dividend?
4. Is ANNLZD = ADJ_DIV × FREQ?
5. Is NORMALZD = ANNLZD / 52?
6. Do weekly dividends show NORMALZD = ADJ_DIV?
7. Do monthly dividends show NORMALZD = (ADJ_DIV × 12) / 52?

## Questions for Gemini

After running the script, please verify:
1. Are all calculations correct according to the rules above?
2. Does the frequency detection match the expected pattern (backward confirmation)?
3. Are the normalized values correct (weekly equivalent rates)?
4. Are there any discrepancies compared to the CEO's spreadsheet?

