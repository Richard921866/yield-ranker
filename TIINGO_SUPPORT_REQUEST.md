# Tiingo Support Request: Adjusted Dividend Calculation

## Question for Tiingo Support/Sales

**Subject:** How to Calculate Adjusted Dividends to Match Industry Standards (Seeking Alpha)

**Context:**
We are building a dividend analysis platform and need to calculate adjusted dividends that match industry standards (specifically Seeking Alpha's methodology).

**Current Implementation:**
We are calculating adjusted dividends using:
```
adjusted_dividend = divCash × (adjClose / close)
```
This is calculated on each ex-dividend date using the ratio of adjusted close to unadjusted close on that date.

**Problem:**
Our adjusted dividends do not match Seeking Alpha's values. For example, for TSLY:
- Our calculation: $0.0887 raw → $0.4279 adjusted (4.82x)
- Seeking Alpha: $0.0887 raw → $0.4435 adjusted (5.0x)

**Questions:**

1. **Does Tiingo provide a pre-calculated "adjusted dividend" field in any API endpoint?**
   - If yes, which endpoint and field name?
   - If no, what is the recommended formula?

2. **What is the correct method to calculate adjusted dividends that match industry standards?**
   - Should we use `divCash × (adjClose/close)` on the ex-date?
   - Or should we use a cumulative adjustment factor from inception?
   - Or is there another method Tiingo recommends?

3. **For reverse stock splits specifically:**
   - How should historical dividends be adjusted?
   - Should the adjustment factor be calculated from the most recent split date, or from inception?

4. **Do you have documentation or examples showing how to calculate adjusted dividends that match other data providers (Seeking Alpha, Yahoo Finance, etc.)?**

**Example Data:**
- Ticker: TSLY
- Raw dividend on 2025-11-20: $0.0887
- Our adjusted: $0.4279 (using adjClose/close ratio)
- Seeking Alpha adjusted: $0.4435
- Difference: ~3.6%

**Use Case:**
We need to calculate Dividend Volatility Index (DVI) using adjusted dividends, and our values must match industry standards for credibility.

**Contact Information:**
[Your contact details]

---

## Expected Response

We need:
1. The exact API endpoint/field for adjusted dividends (if available)
2. The exact formula Tiingo recommends
3. Documentation or examples
4. Confirmation that our method matches industry standards

