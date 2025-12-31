# Signal Ratings Explanation (-2 to +3)

## Overview

The Signal rating is a composite score that combines **Z-Score** (premium/discount valuation) and **NAV Trends** (asset health) to provide a quick investment signal for Closed-End Funds (CEFs).

---

## Rating Scale

| Rating | Meaning | Investment Signal |
|--------|---------|-------------------|
| **+3** | Optimal | Best opportunity: Cheap + Growing assets |
| **+2** | Good Value | Attractive: Cheap + Recent growth |
| **+1** | Healthy | Neutral-positive: Assets growing (but not cheap) |
| **0** | Neutral | No clear signal |
| **-1** | Value Trap | Warning: Looks cheap but assets shrinking |
| **-2** | Overvalued | Avoid: Statistically expensive |

---

## Required Inputs

1. **Z-Score** (3-Year): How cheap/expensive the CEF is relative to its historical average
   - Negative = Cheap (below average premium/discount)
   - Positive = Expensive (above average premium/discount)
   - Threshold: **-1.5** (1.5 standard deviations)

2. **6-Month NAV Trend**: Percentage change in Net Asset Value over last 6 months
   - Positive = Assets growing
   - Negative = Assets shrinking
   - Uses **adjusted NAV prices** (accounts for distributions)

3. **12-Month NAV Trend**: Percentage change in Net Asset Value over last 12 months
   - Positive = Assets growing
   - Negative = Assets shrinking
   - Uses **adjusted NAV prices** (accounts for distributions)

---

## Calculation Logic (Decision Tree)

The system uses a simple decision tree to assign ratings:

### Step 1: Check if Optimal (+3)
**Condition:** `Z-Score < -1.5` AND `6M NAV Trend > 0` AND `12M NAV Trend > 0`
- **Meaning:** Cheap price + Both short-term and long-term asset growth
- **Signal:** Best opportunity - buy when undervalued with strong asset health

### Step 2: Check if Good Value (+2)
**Condition:** `Z-Score < -1.5` AND `6M NAV Trend > 0` (12M can be anything)
- **Meaning:** Cheap price + Recent asset growth (6 months)
- **Signal:** Attractive investment - undervalued with recent positive momentum

### Step 3: Check if Healthy (+1)
**Condition:** `Z-Score > -1.5` AND `6M NAV Trend > 0`
- **Meaning:** Not cheap, but assets are growing
- **Signal:** Neutral-positive - assets healthy but not a bargain

### Step 4: Check if Value Trap (-1)
**Condition:** `Z-Score < -1.5` AND `6M NAV Trend < 0`
- **Meaning:** Looks cheap, but assets are shrinking
- **Signal:** Warning - don't be fooled by low price if assets declining

### Step 5: Check if Overvalued (-2)
**Condition:** `Z-Score > 1.5`
- **Meaning:** Statistically expensive (more than 1.5 standard deviations above average)
- **Signal:** Avoid - paying too much relative to historical average

### Step 6: Default to Neutral (0)
**Condition:** None of the above conditions met
- **Meaning:** No clear signal from the data
- **Signal:** Neutral - wait for clearer opportunity

---

## Examples

### Example 1: Rating +3 (Optimal)
- **Z-Score:** -2.0 (cheap)
- **6M NAV Trend:** +5.2% (growing)
- **12M NAV Trend:** +8.1% (growing)
- **Result:** +3 (Optimal - cheap with strong asset growth)

### Example 2: Rating +2 (Good Value)
- **Z-Score:** -1.8 (cheap)
- **6M NAV Trend:** +3.5% (growing)
- **12M NAV Trend:** -2.1% (declining)
- **Result:** +2 (Good Value - cheap with recent growth, despite longer-term decline)

### Example 3: Rating +1 (Healthy)
- **Z-Score:** -0.5 (slightly cheap, but not significantly)
- **6M NAV Trend:** +4.2% (growing)
- **12M NAV Trend:** +6.3% (growing)
- **Result:** +1 (Healthy - assets growing but not a bargain price)

### Example 4: Rating -1 (Value Trap)
- **Z-Score:** -2.1 (cheap)
- **6M NAV Trend:** -3.8% (shrinking)
- **12M NAV Trend:** -5.2% (shrinking)
- **Result:** -1 (Value Trap - looks cheap but assets declining)

### Example 5: Rating -2 (Overvalued)
- **Z-Score:** +2.3 (expensive)
- **6M NAV Trend:** +2.1% (growing)
- **12M NAV Trend:** +4.5% (growing)
- **Result:** -2 (Overvalued - paying premium despite growth)

### Example 6: Rating 0 (Neutral)
- **Z-Score:** -0.8 (slightly cheap)
- **6M NAV Trend:** -1.2% (slightly shrinking)
- **12M NAV Trend:** +1.5% (slightly growing)
- **Result:** 0 (Neutral - no clear signal)

---

## Important Notes

1. **Minimum History Required:** CEF must have at least **504 trading days** (2 years) of NAV history to calculate Signal rating. Otherwise, Signal = `null`.

2. **Adjusted NAV Prices:** Both 6M and 12M NAV trends use **adjusted NAV prices** (accounts for distributions) to ensure accurate trend calculations.

3. **Z-Score Threshold:** The threshold of **±1.5** standard deviations represents a statistically significant deviation from the historical average premium/discount.

4. **Priority Order:** The decision tree checks conditions in order (Optimal → Good Value → Healthy → Value Trap → Overvalued → Neutral). The first matching condition determines the rating.

---

## Summary

The Signal rating provides a quick, actionable investment signal by combining:
- **Valuation** (Z-Score: cheap vs. expensive)
- **Asset Health** (NAV Trends: growing vs. shrinking)

**Best Opportunities:** +3 and +2 ratings (cheap with growth)
**Avoid:** -2 and -1 ratings (expensive or value traps)
**Neutral:** 0 and +1 ratings (no clear signal or healthy but not a bargain)

