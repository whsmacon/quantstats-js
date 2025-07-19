import pandas as pd
import numpy as np
import quantstats as qs

# Load the data
with open('raw_data_comparison_js.json', 'r') as f:
    import json
    data = json.load(f)
    
returns = pd.Series(data['returns'], dtype=float)

# Calculate components step by step
print("=== PYTHON STEP BY STEP DEBUG ===")
print(f"Returns count: {len(returns)}")
print(f"Returns sum: {returns.sum()}")
print(f"Returns std: {returns.std()}")  # This is ddof=1 by default

# Calculate drawdown series
dd = qs.stats.to_drawdown_series(returns)
print(f"Drawdowns count: {len(dd)}")
print(f"Min drawdown: {dd.min()}")

# Calculate ulcer index
ulcer = qs.stats.ulcer_index(returns)
print(f"Ulcer index: {ulcer}")

# Calculate VaR and CVaR
var_val = qs.stats.value_at_risk(dd, sigma=1, confidence=0.95)
print(f"VaR: {var_val}")

cvar_val = qs.stats.conditional_value_at_risk(dd, sigma=1, confidence=0.95)
print(f"CVaR: {cvar_val}")

# Check if CVaR calculation matches manual
below_var = dd[dd < var_val]
manual_cvar = below_var.mean()
print(f"CVaR manual: {manual_cvar}")
print(f"CVaR matches: {abs(cvar_val - manual_cvar) < 1e-10}")

# Calculate serenity
pitfall = -cvar_val / returns.std()
print(f"Pitfall: {pitfall}")

serenity = (returns.sum() - 0) / (ulcer * pitfall)
print(f"Manual Serenity: {serenity}")

# Official function
serenity_official = qs.stats.serenity_index(returns)
print(f"Official Serenity: {serenity_official}")

print(f"Match: {abs(serenity - serenity_official) < 1e-6}")

# Let's also check first few drawdown values
print("\nFirst 10 drawdown values:")
print(dd.head(10).tolist())
