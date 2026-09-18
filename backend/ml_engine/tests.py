import unittest
import pandas as pd
import numpy as np
import os
import tempfile
from ml_engine.analysis import DatasetAnalysisEngine
from ml_engine.utils import read_dataframe

class MLEngineTests(unittest.TestCase):
    def setUp(self):
        # Create a temporary CSV file for testing
        self.temp_dir = tempfile.TemporaryDirectory()
        self.csv_path = os.path.join(self.temp_dir.name, 'test.csv')
        
        self.df = pd.DataFrame({
            'id': [1, 2, 3, 4],
            'age': [25, 30, np.nan, 40],
            'category': ['A', 'B', 'A', 'C'],
            'target': [0, 1, 0, 1]
        })
        self.df.to_csv(self.csv_path, index=False)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_read_dataframe_csv(self):
        df = read_dataframe(self.csv_path, 'test.csv')
        self.assertEqual(df.shape, (4, 4))
        self.assertIn('age', df.columns)

    def test_dataset_analysis_engine(self):
        engine = DatasetAnalysisEngine(self.df)
        stats = engine.get_statistics()
        
        # Check stats structure
        self.assertIn('age', stats)
        self.assertEqual(stats['age']['count'], 3)
        self.assertAlmostEqual(stats['age']['mean'], 31.6666, places=2)
        
        # Check missing values
        missing = engine.get_missing_values()
        self.assertEqual(missing['age'], 1)
        self.assertEqual(missing['category'], 0)
        
        # Check problem detection
        prob_type = engine.detect_problem_type('target')
        self.assertEqual(prob_type, 'Classification')

from ml_engine.profiler import DatasetProfiler

class DatasetProfilerTests(unittest.TestCase):
    def setUp(self):
        self.test_csv_path = 'test_profile_dataset.csv'
        
        # Create a complex dataset
        data = {
            'id_col': range(1, 101),
            'numeric_col': [i * 1.5 for i in range(100)],
            'categorical_col': ['A'] * 80 + ['B'] * 15 + ['C'] * 5,
            'boolean_col': ['Yes', 'No'] * 50,
            'datetime_col': pd.date_range(start='1/1/2023', periods=100).astype(str),
            'text_col': ['This is a long free text sentence that should be parsed as text because it is very long and has high cardinality. ' + str(i) for i in range(100)],
            'constant_col': [42] * 100,
            'missing_col': [None] * 50 + [1] * 50
        }
        
        # Add an outlier
        data['numeric_col'][0] = 9999.9
        
        df = pd.DataFrame(data)
        df.to_csv(self.test_csv_path, index=False)
        
    def tearDown(self):
        if os.path.exists(self.test_csv_path):
            os.remove(self.test_csv_path)
            
    def test_profiler_output(self):
        profiler = DatasetProfiler(self.test_csv_path)
        profile = profiler.profile()
        
        # Dataset level
        dataset_stats = profile['dataset']
        self.assertEqual(dataset_stats['rows'], 100)
        self.assertEqual(dataset_stats['columns'], 8)
        self.assertIn('constant_col', dataset_stats['constant_columns'])
        self.assertIn('id_col', dataset_stats['potential_identifiers'])
        
        # Column level types
        cols = profile['columns']
        
        self.assertEqual(cols['id_col']['inferred_type'], 'numeric')
        self.assertTrue(cols['id_col']['is_identifier'])
        
        self.assertEqual(cols['numeric_col']['inferred_type'], 'numeric')
        self.assertEqual(cols['numeric_col']['outlier_count'], 1)
        
        self.assertEqual(cols['categorical_col']['inferred_type'], 'categorical')
        self.assertEqual(cols['categorical_col']['most_frequent'], 'A')
        
        self.assertEqual(cols['boolean_col']['inferred_type'], 'boolean')
        
        self.assertEqual(cols['datetime_col']['inferred_type'], 'datetime')
        
        self.assertEqual(cols['text_col']['inferred_type'], 'text')
        
        self.assertEqual(cols['constant_col']['unique_count'], 1)
        
        self.assertEqual(cols['missing_col']['missing_count'], 50)
        self.assertEqual(cols['missing_col']['missing_pct'], 50.0)

from ml_engine.target_detector import TargetDetectionEngine

class TargetDetectionEngineTests(unittest.TestCase):
    def setUp(self):
        self.profile = {
            "dataset": {
                "rows": 100,
                "columns": 6,
            },
            "columns": {
                "user_id": {
                    "inferred_type": "numeric",
                    "unique_count": 100,
                    "unique_pct": 100.0,
                    "is_identifier": True
                },
                "age": {
                    "inferred_type": "numeric",
                    "pandas_dtype": "int64",
                    "unique_count": 45,
                    "unique_pct": 45.0
                },
                "status": {
                    "inferred_type": "categorical",
                    "unique_count": 3,
                    "unique_pct": 3.0
                },
                "churn": {
                    "inferred_type": "boolean",
                    "unique_count": 2,
                    "unique_pct": 2.0
                },
                "price": {
                    "inferred_type": "numeric",
                    "pandas_dtype": "float64",
                    "unique_count": 95,
                    "unique_pct": 95.0
                },
                "post_treatment_effect": {
                    "inferred_type": "numeric",
                    "unique_count": 50,
                    "unique_pct": 50.0
                }
            }
        }
        
    def test_target_detection(self):
        detector = TargetDetectionEngine(self.profile)
        candidates = detector.detect_targets()
        
        # Should not recommend user_id (negative score)
        candidate_names = [c["column"] for c in candidates]
        self.assertNotIn("user_id", candidate_names)
        
        # Churn should be highly recommended (boolean + target naming keyword)
        churn_candidate = next((c for c in candidates if c["column"] == "churn"), None)
        self.assertIsNotNone(churn_candidate)
        self.assertEqual(churn_candidate["confidence"], "High")
        self.assertEqual(churn_candidate["detected_type"], "Classification")
        
        # Price should be regression
        price_candidate = next((c for c in candidates if c["column"] == "price"), None)
        self.assertIsNotNone(price_candidate)
        self.assertEqual(price_candidate["detected_type"], "Regression")
        
        # Leakage warning on post_treatment_effect
        leakage_candidate = next((c for c in candidates if c["column"] == "post_treatment_effect"), None)
        self.assertIsNotNone(leakage_candidate)
        self.assertTrue(leakage_candidate["leakage_warning"])

