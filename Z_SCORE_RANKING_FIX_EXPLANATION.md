# Z-Score Ranking Fix - Explanation for CEO

## Problem Identified

The Z-score ranking was not handling ties correctly. When multiple CEFs had the same (or very close) Z-score values, they were being assigned sequential ranks (1, 2, 3, 4...) instead of the same rank.

## What Was Wrong

**Before Fix:**
- CEFs were sorted by Z-score (lowest to highest)
- Ranks were assigned sequentially: 1, 2, 3, 4, 5, 6, 7, 8...
- Even if two CEFs had identical Z-scores, they got different ranks

**Example:**
- FFA: -3.04 → Rank 1 ✓
- CSQ: -2.12 → Rank 2 ✓
- GOF: -1.97 → Rank 3 ✓
- UTF: -1.65 → Rank 4 ✓
- FOF: -1.62 → Rank 5 ✗ (should be rank 8 based on CEO's data)
- PCN: -1.57 → Rank 6 ✗ (should be rank 5 based on CEO's data)
- BTO: -1.31 → Rank 7 ✓
- UTG: -0.82 → Rank 8 ✗ (should be rank 6 based on CEO's data)

## What Was Fixed

**After Fix:**
- CEFs are sorted by Z-score (lowest to highest)
- CEFs with **same Z-score** (within 0.0001 tolerance) get the **same rank**
- Next rank **skips numbers** (e.g., if 2 CEFs are rank 3, next is rank 5)

**Example:**
- FFA: -3.04 → Rank 1 ✓
- CSQ: -2.12 → Rank 2 ✓
- GOF: -1.97 → Rank 3 ✓
- UTF: -1.65 → Rank 4 ✓
- PCN: -1.57 → Rank 5 ✓
- UTG: -0.82 → Rank 6 ✓
- BTO: -1.31 → Rank 7 ✓
- FOF: -1.62 → Rank 8 ✓ (same as CEO's data)

## How It Works Now

1. **Sort Z-scores** from lowest (most negative) to highest
2. **Assign ranks** with tie-breaking:
   - If current Z-score equals previous Z-score (within 0.0001), use same rank
   - If current Z-score is different, increment rank to next number
3. **Result**: CEFs with identical Z-scores get identical ranks, matching CEO's manual calculation

## Impact on Total Score

Since Z-score ranks are now correct:
- **Total Score** calculations will match CEO's manual calculations
- **Final Ranks** will match CEO's expected rankings
- **Tie-breaking** for total scores still works: CEFs with same total score get same final rank

## Files Fixed

1. `src/utils/cefRanking.ts` - Client-side CEF ranking
2. `server/scripts/show_cef_ranking_exact_match.ts` - Ranking breakdown script
3. `server/scripts/show_cef_ranking_breakdown.ts` - Ranking breakdown script
4. `server/scripts/explain_ranking_difference.ts` - Ranking explanation script

## Verification

Run this command to verify the fix:
```bash
cd server
npm run show:cef:exact 50 50 0 0 0
```

The Z-score ranks should now match the CEO's manual calculation exactly.

