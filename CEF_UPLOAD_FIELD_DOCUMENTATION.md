# CEF Upload Field Documentation

## Required Fields (Manual Upload Only)

These fields **must** be provided in the Excel upload:

1. **Symbol** - Ticker symbol (e.g., DNP, FOF, GOF)
2. **NAV Symbol** - NAV ticker symbol (e.g., XDNPX, XFOFX, XGOFX)
3. **Desc/Description** - Fund description
4. **Open/Open Date** - Opening/inception date (e.g., 1/87, 11/06)
5. **IPO Price** - Initial offering price (e.g., 10.00, 20.00)
6. **#Pmts/# Payments** - Number of payments per year (12 = monthly, 4 = quarterly)

**Note:** If #Pmts is not provided, the system can attempt to determine frequency from dividend history, but it's recommended to provide it for accuracy.

## Fields from Tiingo API

These fields are automatically fetched from Tiingo EOD API:

1. **Price (MP/Market Price)** - Latest closing price
2. **NAV** - Net Asset Value (fetched using NAV Symbol from `prices_daily` table)
3. **Total Returns** - All return fields (10YR, 5YR, 3YR, 12 Month, 6 Month, 3 Month, 1 Month, 1 Week)
4. **52-Week High/Low** - Calculated from price history
5. **DVI (Dividend Volatility Index)** - Calculated from dividend history (12-month period)

## Calculated Fields (Automatic)

These fields are calculated automatically using formulas:

1. **Premium/Discount** - `(Price - NAV) / NAV * 100`
   - Calculated if Price and NAV are available
   - Only updated if not manually uploaded

2. **Forward Yield** - `(Annual Dividend / Price) * 100`
   - Uses calculated Annual Dividend and current Price

3. **Annual Dividend** - `Last Dividend * # Payments per year`
   - Calculated from Last Dividend (from Tiingo or manual upload) and #Pmts

4. **Last Dividend** - Most recent dividend from Tiingo or manual upload
   - Prioritizes manual uploads over Tiingo data
   - Fetched from `dividends_detail` table

## Manual Upload Only Fields (Require Historical Analysis)

These fields require 5+ years of historical discount/NAV data and cannot be calculated automatically:

1. **5Y Z-Score** - Statistical analysis of 5-year discount/premium history
2. **6M NAV Trend %** - 6-month NAV trend calculation
3. **12M NAV Return %** - 12-month NAV return calculation
4. **Value/Health Score** - Composite score (-2 to +3) based on Z-Score, 6M trend, and 12M return

These fields **must be manually uploaded** and will be preserved during `refresh_all` script runs.

## Summary

- **Required for Upload:** Symbol, NAV Symbol, Desc, Open Date, IPO Price, #Pmts
- **From Tiingo:** Price, NAV (via NAV Symbol), Total Returns, 52W High/Low, DVI
- **Calculated:** Premium/Discount, Forward Yield, Annual Dividend, Last Dividend
- **Manual Only:** 5Y Z-Score, 6M NAV Trend, 12M NAV Return, Value/Health Score

