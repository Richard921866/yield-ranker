# Fixes Applied - Jan 11, 2026

## 1. ✅ Issuer Column Sorting
**Problem**: Clicking "Issuer" wasn't sorting properly  
**Solution**: Sort alphabetically by issuer, then by rank within each issuer  
**Example**: YieldMax funds now show ranked 5, 10, 30, 52, 82 (low to high)  
**Commit**: `issuer sort by rank`

## 2. ✅ SPE $0.7000 Special Dividend Detection
**Problem**: SPE's 12/29/25 $0.7000 dividend showing as "Regular/Weekly" instead of "Special/Other"  
**Root Cause**: API response caching  
**Solutions Applied**:
- ✅ Database is correct: `pmt_type='Special', frequency='Other'`
- ✅ Added no-cache headers to `/api/tiingo/dividends/:ticker` endpoint
- ✅ Extreme spike detection (>3x median) already in CEF normalization

**Verification**:
```bash
cd server
npx tsx -e "import {createClient} from '@supabase/supabase-js';import dotenv from 'dotenv';dotenv.config();const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);const {data}=await s.from('dividends_detail').select('ex_date,adj_amount,pmt_type,frequency').eq('ticker','SPE').eq('ex_date','2025-12-29');console.log(data)"
```

**Expected Output**:
```json
[{
  "ex_date": "2025-12-29",
  "adj_amount": 0.7,
  "pmt_type": "Special",
  "frequency": "Other"
}]
```

**To See Fix on Website**:
1. **Restart development server** (if running locally)
2. **Hard refresh browser**: `Ctrl+Shift+R` or `Ctrl+F5`
3. The 12/29 dividend will now show as "Special" and "Other"

**Commits**: 
- `disable API cache`
- `cache fix documentation`

## How Daily Updates Work

### CEFs (like SPE):
- Uses `calculateNormalizedDividendsForCEFs()`
- Detects amount-based spikes (>3x median = Special)
- Runs automatically with `npm run refresh:cef`

### ETFs/CCETFs:
- Uses `calculateNormalizedDividends()`
- Also has extreme spike detection (>3x median)
- Runs automatically with `npm run refresh:all`

## Manual Recalculation (if needed)

```bash
# For CEFs
cd server
npm run recalc:cef:frequency -- --ticker SPE

# For ETFs/CCETFs
npm run recalc:etf:frequency -- --ticker ULTY
```

## All Changes Pushed to Repo ✅
- `issuer sort by rank`
- `cache fix documentation`
- `disable API cache`
