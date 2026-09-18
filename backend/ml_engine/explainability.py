import shap
import numpy as np
import pandas as pd
import warnings

class ModelExplainer:
    """
    Generates explainability insights for trained models using SHAP,
    with a graceful fallback to native feature importances.
    """
    
    def __init__(self, model, X_test, feature_names=None):
        self.model = model
        
        # We need a sample for SHAP. Max 500 rows.
        self.sample_size = min(len(X_test), 500)
        
        if hasattr(X_test, 'shape') and len(X_test.shape) == 2:
            idx = np.random.choice(len(X_test), self.sample_size, replace=False) if len(X_test) > self.sample_size else np.arange(len(X_test))
            self.X_sample = np.array(X_test)[idx]
        else:
            # Fallback if X_test is some weird format
            self.X_sample = X_test[:self.sample_size]
            
        self.feature_names = feature_names
        if not self.feature_names:
            self.feature_names = [f"Feature {i}" for i in range(self.X_sample.shape[1])]
            
    def explain(self):
        """
        Attempts to calculate SHAP values. 
        Returns a sorted list of [feature_name, importance_score].
        Does not block or crash if explainability fails.
        """
        try:
            return self._calculate_shap()
        except Exception as e:
            # Silently fallback to native importance
            return self._fallback_importance()
            
    def _calculate_shap(self):
        # Extract the base estimator if it's a pipeline
        estimator = self.model.steps[-1][1] if hasattr(self.model, 'steps') else self.model
        
        explainer = None
        
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            # Tree models
            if type(estimator).__name__ in ['RandomForestClassifier', 'RandomForestRegressor', 'XGBClassifier', 'XGBRegressor', 'LGBMClassifier', 'LGBMRegressor', 'DecisionTreeClassifier', 'DecisionTreeRegressor']:
                explainer = shap.TreeExplainer(estimator)
            # Linear models
            elif type(estimator).__name__ in ['LogisticRegression', 'LinearRegression', 'Ridge', 'Lasso', 'ElasticNet']:
                explainer = shap.LinearExplainer(estimator, self.X_sample)
            
        if not explainer:
            return self._fallback_importance()
            
        shap_values = explainer.shap_values(self.X_sample)
        
        # If binary classification or multiclass, shap_values might be a list
        if isinstance(shap_values, list):
            # Take the mean of the positive class or average across classes
            shap_values = shap_values[1] if len(shap_values) == 2 else np.mean(shap_values, axis=0)
            
        # Calculate mean absolute SHAP value per feature
        mean_abs_shap = np.mean(np.abs(shap_values), axis=0)
        
        # Try to extract actual feature names from pipeline if missing
        final_feature_names = self.feature_names
        if hasattr(self.model, 'steps') and len(self.model.steps) > 1:
            preprocessor = self.model.steps[0][1]
            if hasattr(preprocessor, 'get_feature_names_out'):
                try:
                    out_names = preprocessor.get_feature_names_out()
                    if len(out_names) == len(mean_abs_shap):
                        final_feature_names = out_names.tolist()
                except Exception:
                    pass
                    
        paired = list(zip(final_feature_names, mean_abs_shap.tolist()))
        paired.sort(key=lambda x: x[1], reverse=True)
        
        return paired[:20]

    def _fallback_importance(self):
        """
        Extracts native feature importance if SHAP fails.
        """
        try:
            estimator = self.model.steps[-1][1] if hasattr(self.model, 'steps') else self.model
            importances = []
            
            if hasattr(estimator, 'feature_importances_'):
                importances = estimator.feature_importances_.tolist()
            elif hasattr(estimator, 'coef_'):
                coefs = estimator.coef_
                if len(coefs.shape) > 1:
                    importances = np.mean(np.abs(coefs), axis=0).tolist()
                else:
                    importances = np.abs(coefs).tolist()
                    
            if not importances:
                return None
                
            final_feature_names = self.feature_names
            if hasattr(self.model, 'steps') and len(self.model.steps) > 1:
                preprocessor = self.model.steps[0][1]
                if hasattr(preprocessor, 'get_feature_names_out'):
                    try:
                        out_names = preprocessor.get_feature_names_out()
                        if len(out_names) == len(importances):
                            final_feature_names = out_names.tolist()
                    except Exception:
                        pass
                        
            paired = list(zip(final_feature_names, importances))
            paired.sort(key=lambda x: x[1], reverse=True)
            return paired[:20]
        except Exception:
            return None
