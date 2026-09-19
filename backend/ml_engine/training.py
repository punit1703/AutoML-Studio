import pandas as pd
import numpy as np
import time
import os
import joblib
import optuna
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold, KFold
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.preprocessing import LabelEncoder, StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# Regression models
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

# Classification models
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

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


class ModelTrainingEngine:
    def __init__(self, df: pd.DataFrame, target_column: str, model_save_dir: str, problem_type: str = None, preprocessing_plan: dict = None, dataset_profile: dict = None, budget: str = "standard"):
        self.df = df.copy()
        self.target_column = target_column
        self.model_save_dir = model_save_dir
        self.problem_type = problem_type
        self.preprocessing_plan = preprocessing_plan
        self.dataset_profile = dataset_profile
        self.budget = budget
        os.makedirs(self.model_save_dir, exist_ok=True)
        self.label_encoder = None
        
    def _build_preprocessor(self):
        from ml_engine.pipeline_builder import PipelineBuilder
        
        X = self.df.drop(columns=[self.target_column])
        numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        potential_cat_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()

        categorical_cols = []
        text_cols = []
        
        for col in potential_cat_cols:
            non_null_vals = X[col].dropna().astype(str)
            if not non_null_vals.empty:
                avg_len = non_null_vals.str.len().mean()
                if avg_len > 30 and X[col].nunique() > 10:
                    text_cols.append(col)
                else:
                    categorical_cols.append(col)
            else:
                categorical_cols.append(col)
                
        if self.preprocessing_plan:
            builder = PipelineBuilder(self.preprocessing_plan)
            preprocessor = builder.build_pipeline()
        else:
            # Fallback to old behavior if no plan provided
            from sklearn.feature_extraction.text import TfidfVectorizer
            
            numeric_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='mean')),
                ('scaler', StandardScaler())
            ])

            categorical_transformer = Pipeline(steps=[
                ('imputer', SimpleImputer(strategy='most_frequent')),
                ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
            ])

            transformers = []
            if numeric_cols:
                transformers.append(('num', numeric_transformer, numeric_cols))
            if categorical_cols:
                transformers.append(('cat', categorical_transformer, categorical_cols))
                
            for col in text_cols:
                transformers.append((f'text_{col}', TfidfVectorizer(max_features=1000, stop_words='english'), col))

            preprocessor = ColumnTransformer(transformers=transformers)
            
        return preprocessor, numeric_cols, categorical_cols, text_cols

    def _prepare_data(self, problem_type):
        X = self.df.drop(columns=[self.target_column])
        y = self.df[self.target_column]
        
        valid_idx = y.dropna().index
        X = X.loc[valid_idx]
        y_valid = y.loc[valid_idx]
        
        if problem_type != 'Regression':
            class_counts = y_valid.value_counts()
            if class_counts.min() < 5:
                raise ValueError(f"Highly imbalanced or sparse classes detected. The minority class '{class_counts.idxmin()}' only has {class_counts.min()} samples, but at least 5 are required for cross-validation.")
                
            le = LabelEncoder()
            y_valid = pd.Series(le.fit_transform(y_valid), index=valid_idx)
            self.label_encoder = le
            
        X_train, X_test, y_train, y_test = train_test_split(X, y_valid, test_size=0.2, random_state=42)
        
        from ml_engine.config import ModelSelectionConfig
        config = ModelSelectionConfig.get_config(self.budget)
        max_rows = config["max_rows"]
        
        if len(X_train) > max_rows:
            if problem_type != 'Regression':
                # Preserve class balance
                X_train, _, y_train, _ = train_test_split(X_train, y_train, train_size=max_rows, stratify=y_train, random_state=42)
            else:
                X_train = X_train.sample(n=max_rows, random_state=42)
                y_train = y_train.loc[X_train.index]
            
        return X_train, X_test, y_train, y_test

    def _get_models(self, preprocessor, selected_models_meta):
        from sklearn.feature_selection import SelectKBest, f_regression, f_classif, VarianceThreshold
        from ml_engine.model_registry import ModelRegistry
        
        all_models = ModelRegistry.get_models()
        models = {}
        
        is_regression = self.problem_type == "Regression"
        score_func = f_regression if is_regression else f_classif
        is_multiclass = self.problem_type == "Multiclass Classification"
        
        for model_info in selected_models_meta:
            name = model_info["name"]
            if name in all_models:
                meta = all_models[name]
                estimator = meta["get_estimator"](is_multiclass)
                
                pipeline = Pipeline([
                    ('preprocessor', preprocessor), 
                    ('variance', VarianceThreshold()), 
                    ('selector', SelectKBest(score_func=score_func)), 
                    ('model', estimator)
                ])
                
                models[name] = (pipeline, meta["param_grid"])
                
        return models

    def train_and_evaluate(self, progress_callback=None):
        if not self.problem_type:
            raise ValueError("problem_type must be specified")
            
        is_regression = self.problem_type == "Regression"
        
        # Get Model Recommendations
        if progress_callback: progress_callback("Selecting optimal models", 15)
        from ml_engine.model_recommendation import ModelRecommendationEngine
        from ml_engine.config import ModelSelectionConfig
        
        config = ModelSelectionConfig.get_config(self.budget)
        cv_splits = config["cv_splits"]
        search_budget = config["search_budget"]
        timeout_per_model = config["timeout_per_model"]
        
        dummy_profile = {
            "dataset": {"rows": len(self.df), "columns": len(self.df.columns)},
            "columns": {} 
        }
        if hasattr(self, 'dataset_profile') and self.dataset_profile:
            rec_engine = ModelRecommendationEngine(self.dataset_profile, self.problem_type)
        else:
            rec_engine = ModelRecommendationEngine(dummy_profile, self.problem_type)
            
        recommendation = rec_engine.recommend(budget_tier=self.budget)
        selected_models_meta = recommendation["selected_models"]
        
        if progress_callback: progress_callback("Preparing data", 25)
        X_train, X_test, y_train, y_test = self._prepare_data(self.problem_type)
        
        if progress_callback: progress_callback("Building preprocessing pipeline", 35)
        preprocessor, num_cols, cat_cols, text_cols = self._build_preprocessor()
        
        if progress_callback: progress_callback("Setting up models", 45)
        
        models = self._get_models(preprocessor, selected_models_meta)
        
        if is_regression:
            cv_splitter = KFold(n_splits=cv_splits, shuffle=True, random_state=42)
        else:
            cv_splitter = StratifiedKFold(n_splits=cv_splits, shuffle=True, random_state=42)
            
        from ml_engine.evaluation import ModelEvaluator
        evaluator = ModelEvaluator(self.problem_type, label_classes=self.label_encoder.classes_ if self.label_encoder else None)
        
        results = []
        best_overall_model = None
        best_overall_score = -float('inf')
        best_model_name = ""
        best_model_metrics = {}
        
        total_models = len(models)
        
        for idx, (name, (base_model, param_grid)) in enumerate(models.items()):
            if progress_callback:
                progress_val = 50 + int(40 * (idx / total_models))
                progress_callback(f"Training {name}", progress_val)
                
            start_time = time.time()
            try:
                if param_grid:
                    def objective(trial):
                        # Construct parameters for this trial based on param_grid
                        params = {}
                        for p_name, p_values in param_grid.items():
                            if isinstance(p_values, list):
                                if all(isinstance(v, int) for v in p_values if v is not None and v != 'all'):
                                    # Categorical choice for integers/strings
                                    params[p_name] = trial.suggest_categorical(p_name, p_values)
                                elif all(isinstance(v, float) for v in p_values):
                                    params[p_name] = trial.suggest_categorical(p_name, p_values)
                                else:
                                    params[p_name] = trial.suggest_categorical(p_name, p_values)
                        
                        model = base_model
                        model.set_params(**params)
                        
                        scoring = 'r2' if is_regression else 'accuracy'
                        scores = cross_val_score(model, X_train, y_train, cv=cv_splitter, scoring=scoring, n_jobs=-1)
                        return scores.mean()

                    # Optimize
                    optuna.logging.set_verbosity(optuna.logging.WARNING)
                    study = optuna.create_study(direction='maximize')
                    study.optimize(objective, n_trials=search_budget, timeout=timeout_per_model)
                    
                    # Best model
                    model = base_model
                    model.set_params(**study.best_params)
                    model.fit(X_train, y_train)
                    cv_score = study.best_value
                else:
                    model = base_model
                    model.fit(X_train, y_train)
                    cv_score = 0.0 # fallback
                    
                training_time = time.time() - start_time
                
                if progress_callback:
                    progress_callback(f"Evaluating {name}", progress_val + 2)
                    
                eval_results = evaluator.evaluate(model, X_test, y_test)
                eval_results["cv_score"] = float(cv_score)
                
                score_for_comparison = eval_results["primary_score"]
                
                if score_for_comparison > best_overall_score:
                    best_overall_score = score_for_comparison
                    best_overall_model = model
                    best_model_name = name
                    best_model_metrics = eval_results["metrics"]
                    best_model_metrics["cv_score"] = float(cv_score)
                    
                results.append({
                    'model_name': name,
                    'status': 'success',
                    'training_time': round(training_time, 4),
                    'evaluation': eval_results
                })
            except Exception as e:
                import traceback
                results.append({
                    'model_name': name,
                    'status': 'error',
                    'error': str(e)
                })
                
        if progress_callback: progress_callback("Saving best model", 90)
                
        # Save ONLY the best model
        model_filename = f"pipeline.pkl"
        model_path = os.path.join(self.model_save_dir, model_filename)
        if best_overall_model:
            joblib.dump(best_overall_model, model_path)
            
        relative_path = os.path.join(os.path.basename(os.path.dirname(self.model_save_dir)), os.path.basename(self.model_save_dir), model_filename).replace("\\", "/")
        
        # Build smart feature schema for dynamic frontend forms
        features_schema = []
        for col in X_train.columns:
            dtype = X_train[col].dtype
            feat = {"name": col, "type": "text", "optional": True}
            
            if col in text_cols:
                feat["type"] = "long_text"
            elif pd.api.types.is_numeric_dtype(dtype):
                # Detect boolean by checking unique values
                nunique = X_train[col].dropna().nunique()
                unique_vals = X_train[col].dropna().unique()
                if nunique == 2 and set(unique_vals).issubset({0, 1, 0.0, 1.0}):
                    feat["type"] = "boolean"
                else:
                    feat["type"] = "numeric"
                    feat["min"] = float(X_train[col].min())
                    feat["max"] = float(X_train[col].max())
            else:
                feat["type"] = "categorical"
                # Get unique categories from the training set, dropping NaNs
                categories = X_train[col].dropna().unique().tolist()
                feat["options"] = [str(cat) for cat in categories]
                
            features_schema.append(feat)
            
        modality = "tabular"
        # Since text_cols, num_cols, cat_cols are no longer easily available here without reparsing the plan, 
        # we can just default to tabular, or extract from preprocessing_plan.
        prep_plan = self.preprocessing_plan or {}
        num_cols = [k for k, v in prep_plan.items() if v.get('type') == 'numeric']
        cat_cols = [k for k, v in prep_plan.items() if v.get('type') == 'categorical']
        text_cols = [k for k, v in prep_plan.items() if v.get('type') == 'text']
        
        if len(text_cols) > 0:
            if len(num_cols) == 0 and len(cat_cols) == 0:
                modality = "text"
            else:
                modality = "tabular_text_hybrid"
        
        if progress_callback: progress_callback("Explaining features", 90)
                
        # Explainability for best model
        shap_summary = None
        if best_overall_model:
            from ml_engine.explainability import ModelExplainer
            explainer = ModelExplainer(best_overall_model, X_test)
            shap_summary = explainer.explain()
                
        if progress_callback: progress_callback("Exporting model artifact", 92)
        # Save ONLY the best model
        model_filename = f"pipeline.pkl"
        model_path = os.path.join(self.model_save_dir, model_filename)
        
        metadata_filename = f"pipeline_metadata.json"
        metadata_path = os.path.join(self.model_save_dir, metadata_filename)

        if best_overall_model:
            joblib.dump(best_overall_model, model_path)
            
            import json
            from datetime import datetime
            
            metadata = {
                "model_name": best_model_name,
                "problem_type": self.problem_type,
                "target_column": self.target_column,
                "feature_columns": features_schema,
                "training_dataset_rows": self.X.shape[0] if hasattr(self, 'X') else 0,
                "primary_metric": best_model_metrics.get("primary_metric", ""),
                "primary_score": best_model_metrics.get("primary_score", None),
                "preprocessing_version": "1.0",
                "creation_timestamp": datetime.utcnow().isoformat()
            }
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=4)
            
        relative_path = os.path.join(os.path.basename(os.path.dirname(self.model_save_dir)), os.path.basename(self.model_save_dir), model_filename).replace("\\", "/")

        if progress_callback: progress_callback("Pipeline generated successfully", 100)

        schema = {
            "modality": modality,
            "numeric": num_cols,
            "categorical": cat_cols,
            "text": text_cols,
            "target": self.target_column,
            "problem_type": self.problem_type,
            "features": features_schema
        }

        return {
            'problem_type': self.problem_type,
            'models_evaluated': results,
            'dataset_rows': self.X.shape[0] if hasattr(self, 'X') else 0,
            'best_model': {
                'name': best_model_name,
                'metrics': best_model_metrics,
                'model_path': f"/media/{relative_path}",
                'absolute_path': model_path,
                'schema': schema,
                'label_classes': self.label_encoder.classes_.tolist() if self.label_encoder else None,
                'shap_summary': shap_summary
            }
        }
