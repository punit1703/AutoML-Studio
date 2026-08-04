import pandas as pd
import numpy as np
import time
import os
import joblib
from sklearn.model_selection import train_test_split, RandomizedSearchCV, StratifiedKFold, KFold
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
    def __init__(self, df: pd.DataFrame, target_column: str, model_save_dir: str):
        self.df = df.copy()
        self.target_column = target_column
        self.model_save_dir = model_save_dir
        os.makedirs(self.model_save_dir, exist_ok=True)
        self.label_encoder = None
        
    def _detect_problem_type(self):
        if self.target_column not in self.df.columns:
            raise ValueError(f"Target column '{self.target_column}' not found.")
            
        dtype = self.df[self.target_column].dtype
        if pd.api.types.is_numeric_dtype(dtype):
            unique_count = self.df[self.target_column].nunique()
            if unique_count <= 20:
                return "classification"
            return "regression"
        return "classification"

    def _build_preprocessor(self):
        X = self.df.drop(columns=[self.target_column])
        numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()

        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='mean')),
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_cols),
                ('cat', categorical_transformer, categorical_cols)
            ]
        )
        return preprocessor, numeric_cols, categorical_cols

    def _prepare_data(self, problem_type):
        X = self.df.drop(columns=[self.target_column])
        y = self.df[self.target_column]
        
        valid_idx = y.dropna().index
        X = X.loc[valid_idx]
        y_valid = y.loc[valid_idx]
        
        if problem_type == 'classification':
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
        
    def _get_classification_models(self, preprocessor):
        from sklearn.feature_selection import SelectKBest, f_classif, VarianceThreshold

        k_options = [10, 20, 50, 'all']

        models = {}
        models['Logistic Regression'] = (
            Pipeline([('preprocessor', preprocessor), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_classif)), ('model', LogisticRegression(max_iter=500, random_state=42))]),
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
            models['XGBoost'] = (
                Pipeline([('preprocessor', preprocessor), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_classif)), ('model', xgb.XGBClassifier(random_state=42))]),
                {
                    'selector__k': k_options,
                    'model__n_estimators': [50, 100],
                    'model__learning_rate': [0.01, 0.1]
                }
            )
            
        return models

    def train_and_evaluate(self):
        problem_type = self._detect_problem_type()
        X_train, X_test, y_train, y_test = self._prepare_data(problem_type)
        preprocessor, num_cols, cat_cols = self._build_preprocessor()
        
        if problem_type == 'regression':
            models = self._get_regression_models(preprocessor)
            cv_splitter = KFold(n_splits=3, shuffle=True, random_state=42)
        else:
            models = self._get_classification_models(preprocessor)
            cv_splitter = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
            
        results = []
        best_overall_model = None
        best_overall_score = -float('inf')
        best_model_name = ""
        best_model_metrics = {}
        
        search_budget = 3  
        
        for name, (base_model, param_grid) in models.items():
            start_time = time.time()
            try:
                if param_grid:
                    search = RandomizedSearchCV(base_model, param_distributions=param_grid, 
                                                n_iter=search_budget, cv=cv_splitter, n_jobs=None, random_state=42)
                    search.fit(X_train, y_train)
                    model = search.best_estimator_
                    cv_score = search.best_score_
                else:
                    model = base_model
                    model.fit(X_train, y_train)
                    cv_score = 0.0 # fallback
                    
                training_time = time.time() - start_time
                y_pred = model.predict(X_test)
                
                metrics = {}
                score_for_comparison = cv_score
                
                if problem_type == 'regression':
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
                
        # Save ONLY the best model
        model_filename = f"best_model_pipeline.joblib"
        model_path = os.path.join(self.model_save_dir, model_filename)
        if best_overall_model:
            joblib.dump(best_overall_model, model_path)
            
        relative_path = os.path.join(os.path.basename(os.path.dirname(self.model_save_dir)), os.path.basename(self.model_save_dir), model_filename).replace("\\", "/")
        
        # Build smart feature schema for dynamic frontend forms
        features_schema = []
        for col in X_train.columns:
            dtype = X_train[col].dtype
            feat = {"name": col, "type": "text", "optional": False}
            
            if pd.api.types.is_numeric_dtype(dtype):
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
        
        # Schema representing the required input for the pipeline
        schema = {
            "numeric": num_cols,
            "categorical": cat_cols,
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
