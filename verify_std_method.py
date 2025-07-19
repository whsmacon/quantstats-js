import pandas as pd
import numpy as np
import json

def test_std_calculation():
    """Test what std() method Python pandas actually uses"""
    
    # Load the exact same returns Python quantstats used
    with open('python_quantstats_results.json', 'r') as f:
        data = f.read()
        # Replace NaN with null for JSON parsing
        data = data.replace('NaN', 'null')
        results = json.loads(data)
    
    returns = results['returns']
    print(f"Testing with {len(returns)} returns")
    
    # Convert to pandas Series
    returns_series = pd.Series(returns)
    
    # Test different std() methods
    std_default = returns_series.std()  # Default pandas (ddof=1)
    std_ddof0 = returns_series.std(ddof=0)  # Population std
    std_ddof1 = returns_series.std(ddof=1)  # Sample std (explicit)
    
    print(f"pandas std() default: {std_default}")
    print(f"pandas std(ddof=0): {std_ddof0}")  
    print(f"pandas std(ddof=1): {std_ddof1}")
    
    # Manual calculation
    mean_val = returns_series.mean()
    n = len(returns_series)
    
    sample_var = sum((x - mean_val)**2 for x in returns_series) / (n - 1)
    pop_var = sum((x - mean_val)**2 for x in returns_series) / n
    
    print(f"Manual sample std: {np.sqrt(sample_var)}")
    print(f"Manual pop std: {np.sqrt(pop_var)}")
    
    # Check what numpy uses by default
    numpy_std = np.std(returns)
    numpy_std_ddof1 = np.std(returns, ddof=1)
    
    print(f"numpy std() default: {numpy_std}")  # This uses ddof=0 by default
    print(f"numpy std(ddof=1): {numpy_std_ddof1}")
    
    return {
        'pandas_default': std_default,
        'pandas_ddof0': std_ddof0,
        'pandas_ddof1': std_ddof1,
        'numpy_default': numpy_std,
        'numpy_ddof1': numpy_std_ddof1
    }

if __name__ == "__main__":
    test_std_calculation()
