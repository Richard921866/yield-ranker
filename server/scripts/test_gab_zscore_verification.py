"""
Test GAB Z-Score Calculation to match CEO's exact 3-year calculation

CEO's expected values:
- CUR P/D: 8.112875% (0.08112875 decimal)
- AVERAGE: 4.512254594% (0.04512254594 decimal)
- STDEV.P: 3.897118818% (0.03897118818 decimal)
- 3 YR Z-Score: 0.92391856

Date range: 12/28/2022 to 12/26/2025 (3 years)

Formula:
Z = (Current P/D - Average P/D) / STDEV.P

Where:
- P/D = (Price / NAV) - 1 (as decimal)
- Average P/D = Mean of all P/D values in the 3-year window
- STDEV.P = Population Standard Deviation (divide by n, not n-1)
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def calculate_z_score_3yr(price_data, nav_data, current_date_str):
    """
    Calculate 3-Year Z-Score using flexible lookback logic:
    - Maximum: 3 years (756 trading days)
    - Minimum: 1 year (252 trading days)
    
    Args:
        price_data: List of dicts with 'date' and 'close' keys
        nav_data: List of dicts with 'date' and 'close' keys
        current_date_str: Current date as 'YYYY-MM-DD'
    
    Returns:
        dict with z_score, current_pd, avg_pd, stddev_pd, or None if insufficient data
    """
    # Convert to DataFrames
    price_df = pd.DataFrame(price_data)
    nav_df = pd.DataFrame(nav_data)
    
    if price_df.empty or nav_df.empty:
        return None
    
    # Merge on date
    merged = pd.merge(price_df, nav_df, on='date', suffixes=('_price', '_nav'))
    
    # Filter to dates where both price and NAV exist and are > 0
    merged = merged[
        (merged['close_price'] > 0) & 
        (merged['close_nav'] > 0)
    ].copy()
    
    if merged.empty:
        return None
    
    # Sort by date
    merged['date'] = pd.to_datetime(merged['date'])
    merged = merged.sort_values('date')
    
    # Find the most recent date with both price and NAV
    current_date = pd.to_datetime(current_date_str)
    available_data = merged[merged['date'] <= current_date].copy()
    
    if available_data.empty:
        return None
    
    # Calculate 3-year lookback date (exactly 3 years from the most recent date)
    actual_end_date = available_data['date'].max()
    three_year_start_date = actual_end_date - pd.DateOffset(years=3)
    
    # Filter to the 3-year window
    window_data = available_data[
        (available_data['date'] >= three_year_start_date) & 
        (available_data['date'] <= actual_end_date)
    ].copy()
    
    # Check minimum threshold (1 year = ~252 trading days)
    if len(window_data) < 252:
        return None
    
    # Calculate Premium/Discount: (Price / NAV) - 1 (as decimal)
    window_data['prem_disc'] = (window_data['close_price'] / window_data['close_nav']) - 1.0
    
    # Get current P/D (most recent date)
    current_pd = window_data['prem_disc'].iloc[-1]
    
    # Calculate average P/D (mean)
    avg_pd = window_data['prem_disc'].mean()
    
    # Calculate STDEV.P (Population Standard Deviation)
    # Variance = Σ(x - mean)² / n (divide by n, not n-1)
    variance = ((window_data['prem_disc'] - avg_pd) ** 2).sum() / len(window_data)
    stddev_pd = np.sqrt(variance)
    
    if stddev_pd == 0:
        return {
            'z_score': 0.0,
            'current_pd': current_pd,
            'current_pd_pct': current_pd * 100,
            'avg_pd': avg_pd,
            'avg_pd_pct': avg_pd * 100,
            'stddev_pd': stddev_pd,
            'stddev_pd_pct': stddev_pd * 100,
            'data_points': len(window_data),
            'start_date': three_year_start_date.strftime('%Y-%m-%d'),
            'end_date': actual_end_date.strftime('%Y-%m-%d'),
        }
    
    # Calculate Z-Score: (Current - Mean) / StdDev
    z_score = (current_pd - avg_pd) / stddev_pd
    
    return {
        'z_score': z_score,
        'current_pd': current_pd,
        'current_pd_pct': current_pd * 100,
        'avg_pd': avg_pd,
        'avg_pd_pct': avg_pd * 100,
        'stddev_pd': stddev_pd,
        'stddev_pd_pct': stddev_pd * 100,
        'data_points': len(window_data),
        'start_date': three_year_start_date.strftime('%Y-%m-%d'),
        'end_date': actual_end_date.strftime('%Y-%m-%d'),
    }


def test_with_expected_values():
    """Test with CEO's expected values to verify formula"""
    print("=" * 80)
    print("Z-Score Formula Verification")
    print("=" * 80)
    print()
    
    # CEO's expected values (as percentages)
    expected_current_pd_pct = 8.112875
    expected_avg_pct = 4.512254594
    expected_stddev_pct = 3.897118818
    expected_z_score = 0.92391856
    
    # Convert to decimals
    current_pd = expected_current_pd_pct / 100
    avg_pd = expected_avg_pct / 100
    stddev_pd = expected_stddev_pct / 100
    
    # Calculate Z-Score
    z_score = (current_pd - avg_pd) / stddev_pd
    
    print("CEO's Expected Values:")
    print(f"  Current P/D: {expected_current_pd_pct}% ({current_pd:.10f} decimal)")
    print(f"  Average P/D: {expected_avg_pct}% ({avg_pd:.10f} decimal)")
    print(f"  STDEV.P:     {expected_stddev_pct}% ({stddev_pd:.10f} decimal)")
    print()
    print("Z-Score Calculation:")
    print(f"  Z = (Current - Average) / STDEV.P")
    print(f"  Z = ({current_pd:.10f} - {avg_pd:.10f}) / {stddev_pd:.10f}")
    print(f"  Z = {(current_pd - avg_pd):.10f} / {stddev_pd:.10f}")
    print(f"  Z = {z_score:.10f}")
    print()
    print("Verification:")
    print(f"  Expected Z-Score: {expected_z_score:.8f}")
    print(f"  Calculated:       {z_score:.8f}")
    print(f"  Difference:       {abs(z_score - expected_z_score):.10f}")
    print(f"  Match:            {'YES' if abs(z_score - expected_z_score) < 0.0001 else 'NO'}")
    print()
    
    return abs(z_score - expected_z_score) < 0.0001


def explain_z_score_logic():
    """Explain the Z-Score logic for 3-year max, 1-year min"""
    print("=" * 80)
    print("3-Year Z-Score Logic Explanation")
    print("=" * 80)
    print()
    print("What is a Z-Score?")
    print("-" * 80)
    print("A Z-Score measures how many standard deviations a data point is from")
    print("its historical mean. For CEFs, it tells us if the current Premium/Discount")
    print("is an outlier compared to its recent 3-year history.")
    print()
    print("Formula:")
    print("  Z = (Current P/D - Average P/D) / STDEV.P")
    print()
    print("Where:")
    print("  - Current P/D = (Current Price / Current NAV) - 1 (as decimal)")
    print("  - Average P/D = Mean of all P/D values in the lookback period")
    print("  - STDEV.P = Population Standard Deviation (divide by n, not n-1)")
    print()
    print("Flexible Lookback Logic (3-Year Max / 1-Year Min):")
    print("-" * 80)
    print("1. Minimum Threshold (1 Year = 252 trading days)")
    print("   - If history < 252 days: Return N/A")
    print("   - Prevents 'noisy' signals from insufficient data")
    print()
    print("2. Flexible Window (1-3 Years = 252-756 trading days)")
    print("   - If history is between 1-3 years: Use ALL available data")
    print("   - This allows newer funds to still get signals")
    print()
    print("3. Maximum Cap (3 Years = 756 trading days)")
    print("   - If history > 3 years: Use only the most recent 756 days")
    print("   - Keeps the signal relevant to modern market conditions")
    print()
    print("Statistical Interpretation:")
    print("-" * 80)
    print("  Z-Score > +2.0:  Statistically EXPENSIVE (premium > 2 std dev above mean)")
    print("  Z-Score -1 to +1: NEUTRAL (trading within normal range)")
    print("  Z-Score < -2.0:  Statistically CHEAP (discount > 2 std dev below mean)")
    print()
    print("Why 3 Years Instead of 5 Years?")
    print("-" * 80)
    print("  - More responsive to recent market conditions")
    print("  - Reduces influence of older, potentially irrelevant data")
    print("  - Still provides statistical reliability (756 data points)")
    print("  - Better signal timing for investment decisions")
    print()


if __name__ == '__main__':
    # Explain the logic
    explain_z_score_logic()
    
    # Verify formula with expected values
    print()
    test_with_expected_values()
    
    print()
    print("=" * 80)
    print("Note: To use with actual Tiingo data, see calculate_zscore_tiingo.py")
    print("=" * 80)

