import unittest
import os
import pandas as pd
import tempfile
import shutil
import joblib
from ml_engine.analysis import DatasetAnalysisEngine
from ml_engine.profiler import DatasetProfiler
from ml_engine.target_detector import TargetDetectionEngine
from ml_engine.preprocessing_recommendation import PreprocessingRecommendationEngine
from ml_engine.model_recommendation import ModelRecommendationEngine
from ml_engine.training import ModelTrainingEngine
from ml_engine.pipeline_builder import PipelineBuilder

class EndToEndIntegrationTests(unittest.TestCase):
    """
    True end-to-end integration test bypassing Django views.
    Tests the pure ML lifecycle from CSV to Prediction.
    """
    def setUp(self):
        self.output_dir = tempfile.mkdtemp()
        self.dataset_path = os.path.join(
            os.path.dirname(__file__), 
            'test_data', 
            'simple_classification.csv'
        )

    def tearDown(self):
        shutil.rmtree(self.output_dir)

    def test_full_ml_lifecycle(self):
        # 1. Profile Dataset
        profiler = DatasetProfiler(self.dataset_path)
        profile = profiler.profile()
        self.assertIn("dataset", profile)
        self.assertEqual(profile["dataset"]["rows"], 100)
        
        # 2. Detect Targets
        target_detector = TargetDetectionEngine(profile)
        targets = target_detector.detect_targets()
        self.assertTrue(len(targets) > 0)
        
        # We know 'target' is the target column
        target_col = "target"
        problem_type = target_detector.determine_problem_type(target_col)
        self.assertEqual(problem_type, "Binary Classification")
        
        # 3. Recommend Preprocessing
        prep_engine = PreprocessingRecommendationEngine(profile, target_col)
        prep_plan = prep_engine.generate_plan()
        self.assertIn("target", prep_plan)
        self.assertEqual(prep_plan["target"]["action"], "exclude")
        
        # 4. Recommend Models
        model_engine = ModelRecommendationEngine(profile, problem_type)
        model_recs = model_engine.recommend()
        self.assertTrue(len(model_recs["selected_models"]) > 0)
        
        # 5. Train Models
        df = pd.read_csv(self.dataset_path)
        training_engine = ModelTrainingEngine(
            df=df,
            target_column=target_col,
            model_save_dir=self.output_dir,
            problem_type=problem_type,
            preprocessing_plan=prep_plan,
            budget="fast"
        )
        
        results = training_engine.train_and_evaluate()
        
        self.assertIn("best_model", results)
        self.assertIsNotNone(results["best_model"])
        
        # 6. Artifact Load & Prediction
        model_path = results["best_model"]["absolute_path"]
        self.assertTrue(os.path.exists(model_path))
        
        loaded_model = joblib.load(model_path)
        
        # Raw input with missing target
        raw_input = pd.DataFrame({
            'feature1': [0.5, -1.2],
            'feature2': [1.1, -0.5]
        })
        
        predictions = loaded_model.predict(raw_input)
        self.assertEqual(len(predictions), 2)
        self.assertIn(predictions[0], [0, 1])

if __name__ == '__main__':
    unittest.main()
