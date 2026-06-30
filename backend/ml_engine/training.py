import pandas as pd
import numpy as np
import time
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.preprocessing import LabelEncoder

# Regression models
from sklearn.linear_model import LinearRegression
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
        
        numeric_cols = X.select_dtypes(include=[np.number]).columns
        X = X[numeric_cols]
        X = X.fillna(X.mean()) 
        
        # Drop rows with NA in target
        valid_idx = y.dropna().index
        X = X.loc[valid_idx]
        y_valid = y.loc[valid_idx]
        
        if problem_type == 'classification':
            le = LabelEncoder()
            y_valid = le.fit_transform(y_valid)
            self.label_encoder = le
            
        X_train, X_test, y_train, y_test = train_test_split(X, y_valid, test_size=0.2, random_state=42)
        return X_train, X_test, y_train, y_test
        
    def _get_regression_models(self):
        models = {
            'Linear Regression': LinearRegression(),
            'Decision Tree': DecisionTreeRegressor(random_state=42),
            'Random Forest': RandomForestRegressor(random_state=42),
            'Gradient Boosting': GradientBoostingRegressor(random_state=42),
        }
        if XGB_AVAILABLE:
            models['XGBoost'] = xgb.XGBRegressor(random_state=42)
        return models
        
    def _get_classification_models(self):
        models = {
            'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
            'Decision Tree': DecisionTreeClassifier(random_state=42),
            'Random Forest': RandomForestClassifier(random_state=42),
            'SVM': SVC(probability=True, random_state=42),
            'KNN': KNeighborsClassifier(),
            'Naive Bayes': GaussianNB(),
        }
        if XGB_AVAILABLE:
            models['XGBoost'] = xgb.XGBClassifier(eval_metric='logloss', random_state=42)
        return models
        
    def train_and_evaluate(self):
        problem_type = self._detect_problem_type()
        X_train, X_test, y_train, y_test = self._prepare_data(problem_type)
        
        if problem_type == 'regression':
            models = self._get_regression_models()
        else:
            models = self._get_classification_models()
            
        results = []
        
        for name, model in models.items():
            start_time = time.time()
            try:
                model.fit(X_train, y_train)
                training_time = time.time() - start_time
                
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
                    
                model_filename = f"{name.replace(' ', '_').lower()}.joblib"
                model_path = os.path.join(self.model_save_dir, model_filename)
                joblib.dump(model, model_path)
                
                # Make model path relative to MEDIA_ROOT
                relative_path = os.path.join(os.path.basename(os.path.dirname(self.model_save_dir)), os.path.basename(self.model_save_dir), model_filename).replace("\\", "/")
                
                results.append({
                    'model_name': name,
                    'status': 'success',
                    'training_time': round(training_time, 4),
                    'metrics': metrics,
                    'model_path': f"/media/{relative_path}"
                })
            except Exception as e:
                results.append({
                    'model_name': name,
                    'status': 'error',
                    'error': str(e)
                })
            
        return {
            'problem_type': problem_type,
            'models': results
        }
