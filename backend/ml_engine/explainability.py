import pandas as pd
import numpy as np
import shap

class ExplainabilityEngine:
    def __init__(self, model, X_test: pd.DataFrame, problem_type: str):
        self.model = model
        self.X_test = X_test
        self.problem_type = problem_type
        
    def generate_shap_values(self, sample_size=100):
        if len(self.X_test) > sample_size:
            X_sample = self.X_test.sample(n=sample_size, random_state=42)
        else:
            X_sample = self.X_test
            
        try:
            explainer = shap.TreeExplainer(self.model)
            shap_values = explainer.shap_values(X_sample)
        except Exception:
            try:
                explainer = shap.Explainer(self.model, X_sample)
                shap_values = explainer(X_sample).values
            except Exception:
                return None
                
        if isinstance(shap_values, list):
            shap_values = np.mean(np.abs(shap_values), axis=0) 
            
        if len(shap_values.shape) > 2:
            shap_values = np.mean(np.abs(shap_values), axis=2)
            
        mean_shap = np.abs(shap_values).mean(axis=0)
        
        feature_names = X_sample.columns.tolist()
        shap_dict = {feat: float(val) for feat, val in zip(feature_names, mean_shap)}
        
        shap_dict = dict(sorted(shap_dict.items(), key=lambda x: x[1], reverse=True)[:15])
        
        return shap_dict
