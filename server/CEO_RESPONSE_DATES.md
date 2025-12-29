# Response to CEO - Z-Score Export Date Question

**Question:** "I am curious why your dates ended on 12/22 rather than 12/27? Your last update shows 12/28"

**Answer:**

The Z-score export uses the most recent date where **both** Price and NAV data are available. When the export was run on 12/22, that was the most recent date with complete data for both the CEF price and its NAV symbol.

The script finds the latest date with both Price and NAV like this:
1. It fetches up to 4 years of data for both ticker and NAV symbol
2. It finds all dates where BOTH price AND NAV exist
3. It uses the most recent of those dates as the end date

So if the export ended on 12/22, it means that on that date:
- The CEF had price data available
- The NAV symbol had NAV data available
- But for dates after 12/22 (like 12/23-12/27), either the price or NAV (or both) were not yet available in the database

The system was last updated on 12/28, which means new data may have been added since the export was created. If you run the export again now, it should include any new dates where both Price and NAV are available (up to 12/28 or the most recent date with complete data).

**The Z-score calculation itself is correct** - it's just that the export only includes dates where we have complete data (both Price and NAV), which ensures accuracy.

