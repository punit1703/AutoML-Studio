import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta

def generate_datasets():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Simple Classification
    df_simple = pd.DataFrame({
        'feature1': np.random.randn(100),
        'feature2': np.random.randn(100),
        'target': np.random.choice(['A', 'B'], 100)
    })
    df_simple.to_csv(os.path.join(output_dir, 'simple_classification.csv'), index=False)
    
    # 2. Imbalanced Classification
    target_imbalanced = ['Majority'] * 95 + ['Minority'] * 5
    np.random.shuffle(target_imbalanced)
    df_imbalanced = pd.DataFrame({
        'feature1': np.random.randn(100),
        'feature2': np.random.randn(100),
        'target': target_imbalanced
    })
    df_imbalanced.to_csv(os.path.join(output_dir, 'imbalanced_classification.csv'), index=False)
    
    # 3. Multiclass Classification
    df_multiclass = pd.DataFrame({
        'feature1': np.random.randn(100),
        'feature2': np.random.randn(100),
        'target': np.random.choice(['Red', 'Green', 'Blue', 'Yellow'], 100)
    })
    df_multiclass.to_csv(os.path.join(output_dir, 'multiclass_classification.csv'), index=False)
    
    # 4. Regression
    feature1 = np.random.randn(100)
    feature2 = np.random.randn(100)
    df_regression = pd.DataFrame({
        'feature1': feature1,
        'feature2': feature2,
        'target': 3.5 * feature1 - 2.1 * feature2 + np.random.randn(100) * 0.5
    })
    df_regression.to_csv(os.path.join(output_dir, 'regression.csv'), index=False)
    
    # 5. Mixed Numeric/Categorical
    df_mixed = pd.DataFrame({
        'age': np.random.randint(18, 80, 100),
        'salary': np.random.randn(100) * 10000 + 50000,
        'department': np.random.choice(['HR', 'Engineering', 'Sales'], 100),
        'is_remote': np.random.choice([True, False], 100),
        'target': np.random.choice([0, 1], 100)
    })
    df_mixed.to_csv(os.path.join(output_dir, 'mixed_types.csv'), index=False)
    
    # 6. Missing Values
    df_missing = df_mixed.copy()
    # Introduce NaNs
    df_missing.loc[np.random.choice(100, 10, replace=False), 'age'] = np.nan
    df_missing.loc[np.random.choice(100, 15, replace=False), 'department'] = np.nan
    df_missing.to_csv(os.path.join(output_dir, 'missing_values.csv'), index=False)
    
    # 7. Datetime
    start_date = datetime(2023, 1, 1)
    dates = [start_date + timedelta(days=int(i)) for i in range(100)]
    df_datetime = pd.DataFrame({
        'timestamp': dates,
        'value': np.random.randn(100),
        'target': np.random.choice([0, 1], 100)
    })
    df_datetime.to_csv(os.path.join(output_dir, 'datetime_features.csv'), index=False)
    
    # 8. Text
    df_text = pd.DataFrame({
        'text_col': ['This is a good product', 'Terrible service', 'Average quality', 'Excellent experience', 'Do not buy'] * 20,
        'value': np.random.randn(100),
        'target': np.random.choice(['Positive', 'Negative', 'Neutral'], 100)
    })
    df_text.to_csv(os.path.join(output_dir, 'text_features.csv'), index=False)
    
    # 9. Large Dataset (Simulated, 50k rows)
    # Actually, keep it small enough for tests but large enough to trigger different code paths (e.g., > 10,000 for profiling sampling)
    df_large = pd.DataFrame({
        'feature1': np.random.randn(15000),
        'feature2': np.random.randint(0, 100, 15000),
        'target': np.random.choice([0, 1], 15000)
    })
    df_large.to_csv(os.path.join(output_dir, 'large_dataset.csv'), index=False)
    
    print("All test datasets generated successfully.")

if __name__ == "__main__":
    generate_datasets()
