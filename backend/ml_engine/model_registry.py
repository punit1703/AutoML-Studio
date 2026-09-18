import logging
from typing import Dict, Any, List

# Classification models
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

# Regression models
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False

try:
    import lightgbm as lgb
    LGB_AVAILABLE = True
except ImportError:
    LGB_AVAILABLE = False


logger = logging.getLogger(__name__)

class ModelRegistry:
    """
    Central registry for all available ML models.
    Defines metadata, parameter grids, and model classes.
    """
    
    @classmethod
    def get_models(cls) -> Dict[str, Dict[str, Any]]:
        k_options = [10, 20, 50, 'all']
        
        models = {
            # -------------------------------------------------------------
            # CLASSIFICATION MODELS
            # -------------------------------------------------------------
            "Logistic Regression": {
                "task_type": ["Binary Classification", "Multiclass Classification"],
                "type": "linear",
                "complexity": "low",
                "handles_sparse": True,
                "memory_efficient": True,
                "get_estimator": lambda is_multiclass: LogisticRegression(
                    max_iter=500, 
                    random_state=42, 
                    multi_class='multinomial' if is_multiclass else 'auto'
                ),
                "param_grid": {
                    'selector__k': k_options,
                    'model__C': [0.1, 1.0, 10.0]
                }
            },
            "Random Forest Classifier": {
                "task_type": ["Binary Classification", "Multiclass Classification"],
                "type": "tree_ensemble",
                "complexity": "medium",
                "handles_sparse": False,
                "memory_efficient": False,
                "get_estimator": lambda is_multiclass: RandomForestClassifier(random_state=42),
                "param_grid": {
                    'selector__k': k_options,
                    'model__n_estimators': [50, 100],
                    'model__max_depth': [None, 10, 20]
                }
            },
            
            # -------------------------------------------------------------
            # REGRESSION MODELS
            # -------------------------------------------------------------
            "Linear Regression": {
                "task_type": ["Regression"],
                "type": "linear",
                "complexity": "low",
                "handles_sparse": True,
                "memory_efficient": True,
                "get_estimator": lambda is_multiclass: LinearRegression(),
                "param_grid": {
                    'selector__k': k_options
                }
            },
            "Random Forest Regressor": {
                "task_type": ["Regression"],
                "type": "tree_ensemble",
                "complexity": "medium",
                "handles_sparse": False,
                "memory_efficient": False,
                "get_estimator": lambda is_multiclass: RandomForestRegressor(random_state=42),
                "param_grid": {
                    'selector__k': k_options,
                    'model__n_estimators': [50, 100],
                    'model__max_depth': [None, 10, 20]
                }
            }
        }
        
        # Add XGBoost if available
        if XGB_AVAILABLE:
            models["XGBoost Classifier"] = {
                "task_type": ["Binary Classification", "Multiclass Classification"],
                "type": "tree_ensemble",
                "complexity": "high",
                "handles_sparse": True,
                "memory_efficient": False,
                "get_estimator": lambda is_multiclass: xgb.XGBClassifier(
                    random_state=42, 
                    objective='multi:softprob' if is_multiclass else 'binary:logistic'
                ),
                "param_grid": {
                    'selector__k': k_options,
                    'model__n_estimators': [50, 100],
                    'model__learning_rate': [0.01, 0.1]
                }
            }
            models["XGBoost Regressor"] = {
                "task_type": ["Regression"],
                "type": "tree_ensemble",
                "complexity": "high",
                "handles_sparse": True,
                "memory_efficient": False,
                "get_estimator": lambda is_multiclass: xgb.XGBRegressor(random_state=42),
                "param_grid": {
                    'selector__k': k_options,
                    'model__n_estimators': [50, 100],
                    'model__learning_rate': [0.01, 0.1]
                }
            }
            
        # Add LightGBM if available
        if LGB_AVAILABLE:
            models["LightGBM Classifier"] = {
                "task_type": ["Binary Classification", "Multiclass Classification"],
                "type": "tree_ensemble",
                "complexity": "high",
                "handles_sparse": True,
                "memory_efficient": True,
                "get_estimator": lambda is_multiclass: lgb.LGBMClassifier(random_state=42, verbose=-1),
                "param_grid": {
                    'selector__k': k_options,
                    'model__n_estimators': [50, 100],
                    'model__learning_rate': [0.01, 0.1]
                }
            }
            models["LightGBM Regressor"] = {
                "task_type": ["Regression"],
                "type": "tree_ensemble",
                "complexity": "high",
                "handles_sparse": True,
                "memory_efficient": True,
                "get_estimator": lambda is_multiclass: lgb.LGBMRegressor(random_state=42, verbose=-1),
                "param_grid": {
                    'selector__k': k_options,
                    'model__n_estimators': [50, 100],
                    'model__learning_rate': [0.01, 0.1]
                }
            }
            
        return models
