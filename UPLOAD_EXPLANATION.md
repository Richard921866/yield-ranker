# Upload Functionality Explanation

## Field Flexibility

The upload system is designed to be flexible with your Excel layout. **Only the Symbol/Ticker column is required** - all other fields (Issuer, Description, Pay Day, # Payments, IPO Price) are optional. If you upload a file with only 1 field (Symbol) or 5 fields, the system will:
- Process whatever columns you provide
- Set missing fields to null in the database (they won't overwrite existing data)
- Only update the fields you include in your upload

The system automatically detects column headers by searching for common variations (e.g., "Symbol" or "Ticker", "Pay Day" or "Payment Frequency"). You can use different layouts - as long as the column names are recognizable, it will work.

## Dividend (Div) Column - Optional

The **"Div" column is completely optional**. If you include it:
- The system finds the most recent dividend for each ticker (from Tiingo data)
- Updates **only the dividend amount** ($ value)
- **Preserves all Tiingo data** - dates (ex-date, pay-date, record-date), split adjustments, and other metadata remain intact
- Automatically recalculates metrics (DVI, yield, etc.) after updating

If you don't include the Div column, the upload works normally - it just doesn't update any dividend amounts.

## Handling Missing Tiingo Dividends

If Tiingo doesn't have the latest dividend yet, but you know what it is:
1. Include the "Div" column in your upload with the dividend amount
2. The system will update the most recent existing dividend's amount
3. When Tiingo syncs later (usually within 2-3 days), it will:
   - Match the dividend by ex-date (if provided) OR by amount within ±7 days
   - Replace your manual entry with official Tiingo data (dates, split adjustments, etc.)
   - Your early announcement becomes the official record seamlessly

This allows you to show the latest dividend immediately while Tiingo catches up, without breaking anything or creating duplicate records.

