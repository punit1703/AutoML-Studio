import pytest
import pandas as pd
import numpy as np
from ml_engine.preprocessing import DataPreprocessingEngine
from ml_engine.training import ModelTrainingEngine

@pytest.fixture
def sample_df():
    return pd.DataFrame({
        'num1': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        'num2': [10.1, 9.2, 8.3, 7.4, 6.5, 5.6, 4.7, 3.8, 2.9, 2.0],
        'cat1': ['A', 'A', 'B', 'B', 'A', 'C', 'C', 'A', 'B', 'C'],
        'target_class': [0, 0, 1, 1, 0, 1, 1, 0, 1, 0],
        'target_reg': [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
    })

class TestMLEngineRobustness:
    
    def test_high_cardinality_ohe_drop(self, sample_df):
        # Add a high cardinality column
        high_card_data = [f"val_{i}" for i in range(len(sample_df))]
        sample_df['high_card'] = high_card_data
        
        engine = DataPreprocessingEngine(sample_df)
        engine.encode_one_hot(max_cardinality=5)
        
        # 'cat1' should be encoded, 'high_card' should be dropped
        df_processed = engine.get_dataframe()
        assert 'high_card' not in df_processed.columns
        assert 'cat1_B' in df_processed.columns
        
    def test_imbalanced_classes(self):
        # Create highly imbalanced data (only 1 minority class)
        df = pd.DataFrame({
            'f1': [1]*10,
            'f2': [2]*10,
            'target': [0]*9 + [1]
        })
        
        import tempfile
        import os
        with tempfile.TemporaryDirectory() as tmpdirname:
            engine = ModelTrainingEngine(df, 'target', tmpdirname, problem_type='Binary Classification')
            
            with pytest.raises(ValueError, match="Highly imbalanced or sparse classes detected"):
                engine._prepare_data(problem_type='Binary Classification')
                
    def test_unseen_categories_safe(self, sample_df):
        # Unseen categories handling is naturally verified in how pd.get_dummies is called with dummy_na
        # But more specifically, our ModelTrainingEngine uses OneHotEncoder with handle_unknown='ignore'
        
        with tempfile.TemporaryDirectory() as tmpdirname:
            engine = ModelTrainingEngine(sample_df, 'target_class', tmpdirname, problem_type='Binary Classification')
            preprocessor, _, _, _ = engine._build_preprocessor()
            
            # Extract the pipeline logic
            X = sample_df.drop(columns=['target_class'])
            
            # Fit
            preprocessor.fit(X)
            
            # Transform data with unseen categories
            X_new = X.copy()
            X_new.iloc[0, X_new.columns.get_loc('cat1')] = 'UNSEEN_CATEGORY'
            
            # Should not raise exception
            transformed = preprocessor.transform(X_new)
            assert transformed is not None
