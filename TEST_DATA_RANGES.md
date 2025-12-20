# Testing Data Ranges - How to Check 15-Year Data

## Quick Test Method

Once your server is running, you can test what data we're getting by calling this endpoint:

### Test a Specific CEF

```bash
# In browser or using curl
http://localhost:4000/api/cefs/test-data-range/BTO
```

This will show you:
- How many records we get for 1Y, 3Y, 5Y, 10Y, 15Y, 20Y
- The actual date range of the data
- Whether we have `adj_close` (adjusted close) data
- Sample prices from first and last records

### Example Response

```json
{
  "ticker": "BTO",
  "navSymbol": "XDNPX",
  "description": "John Hancock Financial Opportunities Fund",
  "dataRanges": [
    {
      "period": "15Y",
      "requestedYears": 15,
      "records": 3780,
      "firstDate": "2009-01-15",
      "lastDate": "2024-01-15",
      "actualYears": 15.0,
      "hasAdjClose": true,
      "samplePrices": {
        "first": { "close": 12.50, "adj_close": 8.25 },
        "last": { "close": 25.30, "adj_close": 25.30 }
      }
    }
  ]
}
```

## What the Logs Will Show

When you load the CEF page, the server logs will now show:

```
[INFO] [CEF Metrics] Fetching 15Y NAV data for XDNPX: 2008-12-15 to 2024-01-15
[INFO] [CEF Metrics] Received 3780 NAV records for XDNPX (requested 15Y)
[INFO] [CEF Metrics] Actual date range for XDNPX 15Y: 2009-01-15 to 2024-01-15 (15.0 years, 3780 records)
[INFO] [CEF Metrics] ✅ Calculated 15Y NAV return for XDNPX: 120.50% (3780 records, 2009-01-15 to 2024-01-15)
```

## What This Tells Us

1. **Are we requesting 15 years?** ✅ Yes - the code requests 15 years back
2. **Are we getting 15 years of data?** Check the logs - they'll show the actual date range
3. **Do we have enough data?** The logs show record count and date span

## If 15Y Returns Show N/A

Check the logs for messages like:
- `15Y Return N/A for XDNPX: insufficient data (500 < 2 records)` - Not enough data
- `15Y Return N/A for XDNPX: no data on/after start date 2009-01-15` - Data doesn't go back that far
- `15Y Return N/A for XDNPX: invalid prices` - Data exists but prices are invalid

## Testing Multiple CEFs

You can test multiple CEFs:
- `http://localhost:4000/api/cefs/test-data-range/BTO`
- `http://localhost:4000/api/cefs/test-data-range/GAB`
- `http://localhost:4000/api/cefs/test-data-range/XDNPX`

This will show you which CEFs have 15 years of data and which don't.

