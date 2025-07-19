import json
import numpy as np
import pandas as pd

# Load the data
with open('raw_data_comparison_js.json', 'r') as f:
    data = json.load(f)

returns = pd.Series(data['returns'])

print("=== PYTHON SERENITY DEBUG ===")
print(f"Returns count: {len(returns)}")
print(f"Returns sum: {returns.sum()}")
print(f"Returns mean: {returns.mean()}")
print(f"Returns std: {returns.std()}")

# Calculate drawdowns manually
def to_drawdown_series(returns):
    """Convert returns to drawdown series"""
    prices = (1 + returns).cumprod()
    cum_max = prices.expanding().max()
    drawdowns = (prices / cum_max) - 1
    return drawdowns

dd = to_drawdown_series(returns)
print(f"\nDrawdown series count: {len(dd)}")
print(f"Min drawdown: {dd.min()}")
print(f"Max drawdown: {dd.max()}")

# Calculate CVaR manually - Python style
def cvar_quantile(series, confidence=0.95):
    """Calculate CVaR using quantile method"""
    var = series.quantile(1 - confidence)
    return series[series <= var].mean()

cvar_dd = cvar_quantile(dd, 0.95)
print(f"CVaR of drawdowns (quantile): {cvar_dd}")

# Calculate pitfall
pitfall = -cvar_dd / returns.std()
print(f"Pitfall: {pitfall}")

# Calculate ulcer index manually
def ulcer_index(returns):
    """Calculate Ulcer Index"""
    dd = to_drawdown_series(returns)
    return np.sqrt((dd ** 2).mean())

ulcer = ulcer_index(returns)
print(f"Ulcer Index: {ulcer}")

# Final serenity calculation
serenity = (returns.sum() - 0) / (ulcer * pitfall)
print(f"Serenity Index (manual): {serenity}")

# Load Python results to compare
with open('python_quantstats_results.json', 'r') as f:
    content = f.read().replace('NaN', 'null')
    python_results = json.loads(content)

python_serenity = python_results[0]['metrics']['Serenity Index']
print(f"Python QuantStats result: {python_serenity}")

error = abs((serenity - python_serenity) / python_serenity) * 100
print(f"Error vs Python QuantStats: {error:.2f}%")

# Let's also check what scipy.stats would give us for CVaR
from scipy import stats as scipy_stats

# Try different methods
var_95 = dd.quantile(0.05)  # 5th percentile for 95% confidence
below_var = dd[dd <= var_95]
cvar_simple = below_var.mean()

print(f"\nAlternative CVaR calculations:")
print(f"5th percentile (VaR): {var_95}")
print(f"CVaR (mean below VaR): {cvar_simple}")

pitfall_alt = -cvar_simple / returns.std()
serenity_alt = (returns.sum() - 0) / (ulcer * pitfall_alt)
print(f"Serenity with alternative CVaR: {serenity_alt}")

alt_error = abs((serenity_alt - python_serenity) / python_serenity) * 100
print(f"Alt error: {alt_error:.2f}%")
