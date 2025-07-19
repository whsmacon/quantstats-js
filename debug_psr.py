#!/usr/bin/env python3

import json
import numpy as np

# Simple implementations to avoid pandas/scipy dependencies
def sharpe_simple(returns):
    """Simple Sharpe ratio without pandas"""
    returns = np.array(returns)
    mean_return = np.mean(returns)
    std_return = np.std(returns, ddof=1)  # Use sample std (N-1)
    return mean_return / std_return * np.sqrt(252)  # Annualized

def skew_simple(returns):
    """Simple skew calculation"""
    returns = np.array(returns)
    n = len(returns)
    mean = np.mean(returns)
    std = np.std(returns, ddof=1)
    
    # Sample skewness
    skew_val = (n / ((n-1) * (n-2))) * np.sum(((returns - mean) / std) ** 3)
    return skew_val

def kurtosis_simple(returns):
    """Simple excess kurtosis calculation"""
    returns = np.array(returns)
    n = len(returns)
    mean = np.mean(returns)
    std = np.std(returns, ddof=1)
    
    # Sample kurtosis - 3 (excess kurtosis)
    kurt_val = (n * (n+1) / ((n-1) * (n-2) * (n-3))) * np.sum(((returns - mean) / std) ** 4) - 3 * (n-1)**2 / ((n-2) * (n-3))
    return kurt_val

def norm_cdf_simple(x):
    """Simple normal CDF approximation"""
    # Using the erf function approximation
    return 0.5 * (1 + np.sign(x) * np.sqrt(1 - np.exp(-2 * x**2 / np.pi)))

# Load the same data JavaScript uses
with open('raw_data_comparison_js.json', 'r') as f:
    data = json.load(f)

returns = data['returns']
print(f"Loaded {len(returns)} returns")

# Calculate step by step
print("\n=== PYTHON STEP-BY-STEP CALCULATION ===")
sharpe_val = sharpe_simple(returns)
skew_val = skew_simple(returns)
kurtosis_val = kurtosis_simple(returns)
n = len(returns)

print(f"Sharpe: {sharpe_val}")
print(f"Skew: {skew_val}")
print(f"Kurtosis: {kurtosis_val}")
print(f"n: {n}")

# Calculate sigma_sr using exact Python formula
sigma_sr = np.sqrt(
    (1 + (0.5 * sharpe_val**2) - (skew_val * sharpe_val) + 
     (((kurtosis_val - 3) / 4) * sharpe_val**2)) / (n - 1)
)

print(f"Sigma SR: {sigma_sr}")

# Calculate ratio (rf = 0)
ratio = sharpe_val / sigma_sr
print(f"Ratio: {ratio}")

# Calculate PSR using simple norm.cdf
psr = norm_cdf_simple(ratio)
print(f"PSR (simple): {psr}")

print(f"\nExpected Python result: 0.8677")
print(f"JavaScript result: 0.9900")
