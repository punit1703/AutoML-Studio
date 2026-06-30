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
