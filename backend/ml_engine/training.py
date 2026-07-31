import pandas as pd
import numpy as np
import time
import os
import joblib
from sklearn.model_selection import train_test_split, RandomizedSearchCV, StratifiedKFold, KFold
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.preprocessing import LabelEncoder

# Regression models
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor

# Classification models
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB

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
        self.df = df
        self.target_column = target_column
        self.model_save_dir = model_save_dir
        os.makedirs(self.model_save_dir, exist_ok=True)
        
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

    def _prepare_data(self, problem_type):
        X = self.df.drop(columns=[self.target_column])
        y = self.df[self.target_column]
        
        # Handle missing values
        numeric_cols = X.select_dtypes(include=[np.number]).columns
        categorical_cols = X.select_dtypes(exclude=[np.number]).columns
        
        X[numeric_cols] = X[numeric_cols].fillna(X[numeric_cols].mean())
        for col in categorical_cols:
            X[col] = X[col].fillna(X[col].mode()[0] if not X[col].mode().empty else 'Unknown')
            
        # Encode categorical variables using One-Hot Encoding
        if len(categorical_cols) > 0:
            X = pd.get_dummies(X, columns=categorical_cols, drop_first=True)
        
        valid_idx = y.dropna().index
        X = X.loc[valid_idx]
        y_valid = y.loc[valid_idx]
        
        if problem_type == 'classification':
            le = LabelEncoder()
            y_valid = pd.Series(le.fit_transform(y_valid), index=valid_idx)
            self.label_encoder = le
            
        X_train, X_test, y_train, y_test = train_test_split(X, y_valid, test_size=0.2, random_state=42)
        
        # Aggressive downsampling for rapid AutoML prototyping
        MAX_TRAIN_SIZE = 5000
        if len(X_train) > MAX_TRAIN_SIZE:
            X_train = X_train.sample(n=MAX_TRAIN_SIZE, random_state=42)
            y_train = y_train.loc[X_train.index]
            
        return X_train, X_test, y_train, y_test

    def _get_regression_models(self, data_size):
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler
        from sklearn.feature_selection import SelectKBest, f_regression, VarianceThreshold

        k_options = [10, 20, 50, 'all']

        models = {}
        
        models['Linear Regression'] = (
            Pipeline([('scaler', StandardScaler()), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_regression)), ('model', LinearRegression())]),
            {'selector__k': k_options}
        )
        
        models['Random Forest'] = (
            Pipeline([('scaler', StandardScaler()), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_regression)), ('model', RandomForestRegressor(random_state=42))]),
            {
                'selector__k': k_options,
                'model__n_estimators': [50, 100, 200],
                'model__max_depth': [None, 10, 20, 30],
                'model__min_samples_split': [2, 5, 10]
            }
        )
        
        models['Gradient Boosting'] = (
            Pipeline([('scaler', StandardScaler()), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_regression)), ('model', GradientBoostingRegressor(random_state=42))]),
            {
                'selector__k': k_options,
                'model__n_estimators': [50, 100, 200],
                'model__learning_rate': [0.01, 0.1, 0.2],
                'model__max_depth': [3, 5, 10]
            }
        )
        
        if LGB_AVAILABLE:
            models['LightGBM'] = (
                Pipeline([('scaler', StandardScaler()), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_regression)), ('model', lgb.LGBMRegressor(random_state=42, verbose=-1))]),
                {
                    'selector__k': k_options,
                    'model__n_estimators': [50, 100, 200],
                    'model__learning_rate': [0.01, 0.1, 0.2],
                    'model__num_leaves': [31, 63, 127]
                }
            )
            
        return models
        
    def _get_classification_models(self, data_size):
        from sklearn.pipeline import Pipeline
        from sklearn.preprocessing import StandardScaler
        from sklearn.feature_selection import SelectKBest, f_classif, VarianceThreshold
        import warnings
        
        k_options = [10, 20, 50, 'all']

        models = {}
        
        models['Logistic Regression'] = (
            Pipeline([('scaler', StandardScaler()), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_classif)), ('model', LogisticRegression(max_iter=500, random_state=42))]),
            {
                'selector__k': k_options,
                'model__C': [0.1, 1.0, 10.0],
                'model__penalty': ['l2', None]
            }
        )
        
        models['Random Forest'] = (
            Pipeline([('scaler', StandardScaler()), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_classif)), ('model', RandomForestClassifier(random_state=42))]),
            {
                'selector__k': k_options,
                'model__n_estimators': [50, 100, 200],
                'model__max_depth': [None, 10, 20, 30],
                'model__min_samples_split': [2, 5, 10]
            }
        )
        
        if LGB_AVAILABLE:
            models['LightGBM'] = (
                Pipeline([('scaler', StandardScaler()), ('variance', VarianceThreshold()), ('selector', SelectKBest(score_func=f_classif)), ('model', lgb.LGBMClassifier(random_state=42, verbose=-1))]),
                {
                    'selector__k': k_options,
                    'model__n_estimators': [50, 100, 200],
                    'model__learning_rate': [0.01, 0.1, 0.2],
                    'model__num_leaves': [31, 63, 127]
                }
            )
            
        return models

    def train_and_evaluate(self):
        problem_type = self._detect_problem_type()
        X_train, X_test, y_train, y_test = self._prepare_data(problem_type)
        data_size = len(X_train)
        
        if problem_type == 'regression':
            models = self._get_regression_models(data_size)
            cv_splitter = KFold(n_splits=3, shuffle=True, random_state=42)
            target_score = 0.85 # Target R2
        else:
            models = self._get_classification_models(data_size)
            cv_splitter = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
            target_score = 0.85 # Target Accuracy
            
        results = []
        
        # Iterative optimization attempts: 
        # Attempt 1: 5 combos (Fast)
        search_budgets = [5]  
        
        for name, (base_model, param_grid) in models.items():
            start_time = time.time()
            try:
                best_model = None
                best_cv_score = -float('inf')
                
                # Iterative Try Again loop
                for budget in search_budgets:
                    if param_grid:
                        search = RandomizedSearchCV(base_model, param_distributions=param_grid, 
                                                    n_iter=budget, cv=cv_splitter, n_jobs=None, random_state=42)
                        search.fit(X_train, y_train)
                        current_model = search.best_estimator_
                        cv_score = search.best_score_
                    else:
                        current_model = base_model
                        current_model.fit(X_train, y_train)
                        cv_score = None # Only 1 iteration needed if no param grid
                        
                    if cv_score is None or cv_score > best_cv_score:
                        best_model = current_model
                        best_cv_score = cv_score
                        
                    # Stop if we hit our target accuracy
                    if cv_score is None or cv_score >= target_score:
                        break
                        
                    # Break out early if param grid is small
                    if not param_grid:
                        break
                
                model = best_model
                cv_score = best_cv_score if best_cv_score != -float('inf') else None
                training_time = time.time() - start_time
                
                # Test set evaluation
                y_pred = model.predict(X_test)
                
                metrics = {}
                if problem_type == 'regression':
                    metrics['mse'] = float(mean_squared_error(y_test, y_pred))
                    metrics['mae'] = float(mean_absolute_error(y_test, y_pred))
                    metrics['r2'] = float(r2_score(y_test, y_pred))
                else:
                    metrics['accuracy'] = float(accuracy_score(y_test, y_pred))
                    metrics['f1'] = float(f1_score(y_test, y_pred, average='weighted'))
                    metrics['precision'] = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
                    metrics['recall'] = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
                    
                if cv_score is not None:
                    metrics['cv_score'] = float(cv_score)
                    
                model_filename = f"{name.replace(' ', '_').lower()}.joblib"
                model_path = os.path.join(self.model_save_dir, model_filename)
                joblib.dump(model, model_path)
                
                relative_path = os.path.join(os.path.basename(os.path.dirname(self.model_save_dir)), os.path.basename(self.model_save_dir), model_filename).replace("\\", "/")
                
                results.append({
                    'model_name': name,
                    'status': 'success',
                    'training_time': round(training_time, 4),
                    'metrics': metrics,
                    'model_path': f"/media/{relative_path}"
                })
            except Exception as e:
                import traceback
                results.append({
                    'model_name': name,
                    'status': 'error',
                    'error': str(e) + "\\n" + traceback.format_exc()
                })
            
        return {
            'problem_type': problem_type,
            'models': results
        }
