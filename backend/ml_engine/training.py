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
    def __init__(self, df: pd.DataFrame, target_column: str, model_save_dir: str, problem_type: str = None, preprocessing_plan: dict = None):
        self.df = df.copy()
        self.target_column = target_column
        self.model_save_dir = model_save_dir
        self.problem_type = problem_type
        self.preprocessing_plan = preprocessing_plan
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
            le = LabelEncoder()
            y_valid = pd.Series(le.fit_transform(y_valid), index=valid_idx)
            self.label_encoder = le
            
        X_train, X_test, y_train, y_test = train_test_split(X, y_valid, test_size=0.2, random_state=42)
        
        MAX_TRAIN_SIZE = 5000
        if len(X_train) > MAX_TRAIN_SIZE:
            X_train = X_train.sample(n=MAX_TRAIN_SIZE, random_state=42)
            y_train = y_train.loc[X_train.index]
            
        return X_train, X_test, y_train, y_test

    def _get_regression_models(self, preprocessor):
        from sklearn.feature_selection import SelectKBest, f_regression, VarianceThreshold

        k_options = [10, 20, 50, 'all']

        models = {}
        models['Linear Regression'] = (
            Pipeline([('preprocessor', preprocessor), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_regression)), ('model', LinearRegression())]),
            {'selector__k': k_options}
        )
        
        models['Random Forest'] = (
            Pipeline([('preprocessor', preprocessor), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_regression)), ('model', RandomForestRegressor(random_state=42))]),
            {
                'selector__k': k_options,
                'model__n_estimators': [50, 100],
                'model__max_depth': [None, 10, 20]
            }
        )
        
        if XGB_AVAILABLE:
            models['XGBoost'] = (
                Pipeline([('preprocessor', preprocessor), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_regression)), ('model', xgb.XGBRegressor(random_state=42))]),
                {
                    'selector__k': k_options,
                    'model__n_estimators': [50, 100],
                    'model__learning_rate': [0.01, 0.1]
                }
            )
            
        return models
        
    def _get_classification_models(self, preprocessor, problem_type):
        from sklearn.feature_selection import SelectKBest, f_classif, VarianceThreshold

        k_options = [10, 20, 50, 'all']
        
        is_multiclass = problem_type == "Multiclass Classification"

        models = {}
        
        log_reg = LogisticRegression(max_iter=500, random_state=42, multi_class='multinomial' if is_multiclass else 'auto')
        models['Logistic Regression'] = (
            Pipeline([('preprocessor', preprocessor), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_classif)), ('model', log_reg)]),
            {
                'selector__k': k_options,
                'model__C': [0.1, 1.0, 10.0]
            }
        )
        
        models['Random Forest'] = (
            Pipeline([('preprocessor', preprocessor), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_classif)), ('model', RandomForestClassifier(random_state=42))]),
            {
                'selector__k': k_options,
                'model__n_estimators': [50, 100],
                'model__max_depth': [None, 10, 20]
            }
        )
        
        if XGB_AVAILABLE:
            xgb_objective = 'multi:softprob' if is_multiclass else 'binary:logistic'
            models['XGBoost'] = (
                Pipeline([('preprocessor', preprocessor), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_classif)), ('model', xgb.XGBClassifier(random_state=42, objective=xgb_objective))]),
                {
                    'selector__k': k_options,
                    'model__n_estimators': [50, 100],
                    'model__learning_rate': [0.01, 0.1]
                }
            )
            
        return models

    def train_and_evaluate(self, progress_callback=None):
        if not self.problem_type:
            raise ValueError("problem_type must be specified")
            
        is_regression = self.problem_type == "Regression"
        
        if progress_callback: progress_callback("Preparing data", 25)
        X_train, X_test, y_train, y_test = self._prepare_data(self.problem_type)
        
        if progress_callback: progress_callback("Building preprocessing pipeline", 35)
        preprocessor, num_cols, cat_cols, text_cols = self._build_preprocessor()
        
        if progress_callback: progress_callback("Setting up models", 45)
        if is_regression:
            models = self._get_regression_models(preprocessor)
            cv_splitter = KFold(n_splits=3, shuffle=True, random_state=42)
        else:
            models = self._get_classification_models(preprocessor, self.problem_type)
            cv_splitter = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
            
        results = []
        best_overall_model = None
        best_overall_score = -float('inf')
        best_model_name = ""
        best_model_metrics = {}
        
        search_budget = 3  # Increase this for production, keep low for testing
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
                    study.optimize(objective, n_trials=search_budget, timeout=300)
                    
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
                y_pred = model.predict(X_test)
                
                metrics = {}
                score_for_comparison = cv_score
                
                if is_regression:
                    metrics['mse'] = float(mean_squared_error(y_test, y_pred))
                    metrics['mae'] = float(mean_absolute_error(y_test, y_pred))
                    metrics['r2'] = float(r2_score(y_test, y_pred))
                    if score_for_comparison == 0.0:
                        score_for_comparison = metrics['r2']
                else:
                    metrics['accuracy'] = float(accuracy_score(y_test, y_pred))
                    metrics['f1'] = float(f1_score(y_test, y_pred, average='weighted'))
                    metrics['precision'] = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
                    metrics['recall'] = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
                    if score_for_comparison == 0.0:
                        score_for_comparison = metrics['accuracy']
                        
                metrics['cv_score'] = float(cv_score)
                
                if score_for_comparison > best_overall_score:
                    best_overall_score = score_for_comparison
                    best_overall_model = model
                    best_model_name = name
                    best_model_metrics = metrics
                    
                results.append({
                    'model_name': name,
                    'status': 'success',
                    'training_time': round(training_time, 4),
                    'metrics': metrics,
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
        if len(text_cols) > 0:
            if len(num_cols) == 0 and len(cat_cols) == 0:
                modality = "text"
            else:
                modality = "tabular_text_hybrid"
        
        # Schema representing the required input for the pipeline
        schema = {
            "modality": modality,
            "numeric": num_cols,
            "categorical": cat_cols,
            "text": text_cols,
            "features": features_schema
        }

        return {
            'problem_type': problem_type,
            'models_evaluated': results,
            'best_model': {
                'name': best_model_name,
                'metrics': best_model_metrics,
                'model_path': f"/media/{relative_path}",
                'absolute_path': model_path,
                'schema': schema,
                'label_classes': self.label_encoder.classes_.tolist() if self.label_encoder else None
            }
        }
