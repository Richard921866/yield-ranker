# CEO's Ranking Analysis - Complete Breakdown

## CEO's Data (50% Yield + 50% Z-Score)

Based on CEO's spreadsheet:

| CEF | YIELD | Y RANK | Z-SCORE | Z RANK | TOTAL SCORE | CEO FINAL RANK |
|-----|-------|--------|---------|--------|-------------|----------------|
| GOF | 17.3% | 1      | -1.97   | 3      | 2.00        | 1              |
| PCN | 10.7% | 3      | -1.57   | 5      | 4.00        | 2              |
| UTF | 7.7%  | 7      | -1.65   | 4      | 5.50        | 3              |
| FFA | 7.1%  | 10     | -3.04   | 1      | 5.50        | 3              |
| FOF | 7.9%  | 5      | -1.62   | 8      | 6.50        | 5              |
| IGR | 16.6% | 2      | -0.13   | 11     | 6.50        | 5              |
| CSQ | 6.3%  | 12     | -2.12   | 2      | 7.00        | 7              |
| DNP | 7.8%  | 6      | -0.31   | 9      | 7.50        | 8              |
| BTO | 7.3%  | 9      | -1.31   | 7      | 8.00        | 9              |
| GAB | 9.8%  | 4      | 0.95    | 12     | 8.00        | 9              |
| UTG | 6.5%  | 11     | -0.82   | 6      | 8.50        | 11             |
| BME | 7.6%  | 8      | -0.36   | 10     | 9.00        | 12             |

---

## The Critical Issue: Z-Score Ranking

### CEO's Z-Score Ranks (from spreadsheet):

| Ticker | Z-Score | CEO Z Rank | Correct Z Rank | Match |
|--------|---------|------------|----------------|-------|
| FFA    | -3.04   | 1          | 1              | ✓     |
| CSQ    | -2.12   | 2          | 2              | ✓     |
| GOF    | -1.97   | 3          | 3              | ✓     |
| UTF    | -1.65   | 4          | 4              | ✓     |
| PCN    | -1.57   | 5          | 6              | ✗     |
| UTG    | -0.82   | 6          | 8              | ✗     |
| BTO    | -1.31   | 7          | 7              | ✓     |
| FOF    | -1.62   | 8          | 5              | ✗     |
| DNP    | -0.31   | 9          | 10             | ✗     |
| BME    | -0.36   | 10         | 9              | ✗     |
| IGR    | -0.13   | 11         | 11             | ✓     |
| GAB    | 0.95    | 12         | 12             | ✓     |

### Correct Z-Score Ranking (sorted low to high):

1. FFA: -3.04 ✓
2. CSQ: -2.12 ✓
3. GOF: -1.97 ✓
4. UTF: -1.65 ✓
5. **FOF: -1.62** (CEO shows rank 8 - **WRONG**)
6. **PCN: -1.57** (CEO shows rank 5 - **WRONG**)
7. BTO: -1.31 ✓
8. **UTG: -0.82** (CEO shows rank 6 - **WRONG**)
9. **BME: -0.36** (CEO shows rank 10 - **WRONG**)
10. **DNP: -0.31** (CEO shows rank 9 - **WRONG**)
11. IGR: -0.13 ✓
12. GAB: 0.95 ✓

---

## Impact on Final Ranking

### CEO's Calculation (using incorrect Z-score ranks):

**FOF:**
- YIELD: 7.9% → Rank 5
- Z-SCORE: -1.62 → **CEO uses Rank 8** (incorrect)
- TOTAL SCORE = (5 × 50%) + (8 × 50%) = 2.50 + 4.00 = **6.50**
- CEO Final Rank: 5

**FFA:**
- YIELD: 7.1% → Rank 10
- Z-SCORE: -3.04 → Rank 1 (correct)
- TOTAL SCORE = (10 × 50%) + (1 × 50%) = 5.00 + 0.50 = **5.50**
- CEO Final Rank: 3

**UTF:**
- YIELD: 7.7% → Rank 7
- Z-SCORE: -1.65 → Rank 4 (correct)
- TOTAL SCORE = (7 × 50%) + (4 × 50%) = 3.50 + 2.00 = **5.50**
- CEO Final Rank: 3

### Correct Calculation (using correct Z-score ranks):

**FOF:**
- YIELD: 7.9% → Rank 5
- Z-SCORE: -1.62 → **Correct Rank 5** (not 8)
- TOTAL SCORE = (5 × 50%) + (5 × 50%) = 2.50 + 2.50 = **5.00**
- **Correct Final Rank: 3** (not 5)

**FFA:**
- YIELD: 7.1% → Rank 10
- Z-SCORE: -3.04 → Rank 1 (correct)
- TOTAL SCORE = (10 × 50%) + (1 × 50%) = 5.00 + 0.50 = **5.50**
- **Correct Final Rank: 4** (not 3)

**UTF:**
- YIELD: 7.7% → Rank 7
- Z-SCORE: -1.65 → Rank 4 (correct)
- TOTAL SCORE = (7 × 50%) + (4 × 50%) = 3.50 + 2.00 = **5.50**
- **Correct Final Rank: 4** (not 3)

---

## Root Cause

**The CEO's Z-score ranking has 5 errors:**
1. FOF: -1.62 should be rank 5, CEO shows rank 8
2. PCN: -1.57 should be rank 6, CEO shows rank 5
3. UTG: -0.82 should be rank 8, CEO shows rank 6
4. BME: -0.36 should be rank 9, CEO shows rank 10
5. DNP: -0.31 should be rank 10, CEO shows rank 9

**These Z-score ranking errors cause the final ranking errors:**
- FOF gets total score 6.50 (wrong) instead of 5.00 (correct)
- This makes FOF appear worse than FFA/UTF, when it should be better

---

## Conclusion

**The website's ranking is correct.** The CEO's ranking has errors because:

1. **Z-score ranking is incorrect** (5 errors in Z-score ranks)
2. **This causes incorrect total scores** (FOF gets 6.50 instead of 5.00)
3. **This causes incorrect final ranks** (FOF gets rank 5 instead of rank 3)

**The fix:** The CEO needs to correct the Z-score ranking first, then recalculate the final ranks. Once Z-score ranks are correct, the final ranking will match the website.

