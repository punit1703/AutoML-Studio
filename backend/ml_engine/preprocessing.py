import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler, RobustScaler
from sklearn.feature_selection import SelectKBest, f_classif, f_regression
from scipy import stats

class DataPreprocessingEngine:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()

    def handle_missing_values(self, strategy='mean', fill_value=None, columns=None):
        if columns is None:
            columns = self.df.columns
            
        if strategy == 'drop':
            self.df.dropna(subset=columns, inplace=True)
        elif strategy == 'mean':
            for col in columns:
                if pd.api.types.is_numeric_dtype(self.df[col]):
                    self.df[col] = self.df[col].fillna(self.df[col].mean())
        elif strategy == 'median':
            for col in columns:
                if pd.api.types.is_numeric_dtype(self.df[col]):
                    self.df[col] = self.df[col].fillna(self.df[col].median())
        elif strategy == 'mode':
            for col in columns:
                if not self.df[col].mode().empty:
                    self.df[col] = self.df[col].fillna(self.df[col].mode()[0])
        elif strategy == 'constant':
            for col in columns:
                self.df[col] = self.df[col].fillna(fill_value)
            
        return self

    def remove_duplicates(self):
        self.df.drop_duplicates(inplace=True)
        self.df.reset_index(drop=True, inplace=True)
        return self
        
    def encode_labels(self, columns):
        if columns:
            for col in columns:
                if col in self.df.columns:
                    le = LabelEncoder()
                    self.df[col] = le.fit_transform(self.df[col].astype(str))
        return self
        
    def encode_one_hot(self, columns):
        if columns:
            existing_cols = [col for col in columns if col in self.df.columns]
            if existing_cols:
                self.df = pd.get_dummies(self.df, columns=existing_cols, drop_first=True)
        return self
        
    def scale_features(self, method='standard', columns=None):
        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
            
        existing_cols = [col for col in columns if col in self.df.columns and pd.api.types.is_numeric_dtype(self.df[col])]
        
        if not existing_cols:
            return self
            
        if method == 'standard':
            scaler = StandardScaler()
        elif method == 'min_max':
            scaler = MinMaxScaler()
        elif method == 'robust':
            scaler = RobustScaler()
        else:
            raise ValueError(f"Unknown scaling method: {method}")
            
        self.df[existing_cols] = scaler.fit_transform(self.df[existing_cols])
        return self
        
    def detect_outliers(self, method='iqr', action='drop', columns=None, threshold=3.0):
        if columns is None:
            columns = self.df.select_dtypes(include=[np.number]).columns.tolist()
            
        existing_cols = [col for col in columns if col in self.df.columns and pd.api.types.is_numeric_dtype(self.df[col])]
        
        if not existing_cols:
            return self

        if method == 'z_score':
            z_scores = np.abs(stats.zscore(self.df[existing_cols].dropna()))
            outlier_mask = (z_scores > threshold).any(axis=1)
            outlier_indices = self.df[existing_cols].dropna().index[outlier_mask]
            
        elif method == 'iqr':
            outlier_indices = []
            for col in existing_cols:
                Q1 = self.df[col].quantile(0.25)
                Q3 = self.df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                mask = (self.df[col] < lower_bound) | (self.df[col] > upper_bound)
                outlier_indices.extend(self.df[mask].index.tolist())
            outlier_indices = list(set(outlier_indices))
        else:
            raise ValueError(f"Unknown outlier detection method: {method}")
            
        if action == 'drop':
            self.df.drop(outlier_indices, inplace=True)
            self.df.reset_index(drop=True, inplace=True)
        elif action == 'clip' and method == 'iqr':
            for col in existing_cols:
                Q1 = self.df[col].quantile(0.25)
                Q3 = self.df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                self.df[col] = self.df[col].clip(lower=lower_bound, upper=upper_bound)
                
        return self

    def select_features(self, target_column, k=10, problem_type='classification'):
        if target_column not in self.df.columns:
            raise ValueError(f"Target column {target_column} not found.")
            
        X = self.df.drop(columns=[target_column])
        y = self.df[target_column]
        
        numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            return self
            
        X_num = X[numeric_cols].copy()
        
        # Simple imputation for feature selection if any missing remains
        for col in X_num.columns:
            X_num[col] = X_num[col].fillna(X_num[col].mean())
            
        # Target missing value drop
        valid_indices = y.dropna().index
        X_num = X_num.loc[valid_indices]
        y_valid = y.loc[valid_indices]
        
        if len(y_valid) == 0:
            return self
            
        k = min(k, len(numeric_cols))
        
        if problem_type == 'classification':
            selector = SelectKBest(score_func=f_classif, k=k)
        else:
            selector = SelectKBest(score_func=f_regression, k=k)
            
        selector.fit(X_num, y_valid)
        selected_features = [col for i, col in enumerate(numeric_cols) if selector.get_support()[i]]
        
        non_numeric_cols = X.select_dtypes(exclude=[np.number]).columns.tolist()
        columns_to_keep = selected_features + non_numeric_cols + [target_column]
        
        self.df = self.df[columns_to_keep]
        return self

    def apply_pipeline(self, config: dict):
        if config.get('remove_duplicates'):
            self.remove_duplicates()
            
        if 'missing_values' in config:
            self.handle_missing_values(**config['missing_values'])
            
        if 'outliers' in config:
            self.detect_outliers(**config['outliers'])
            
        if 'encode_labels' in config:
            self.encode_labels(**config['encode_labels'])
            
        if 'encode_one_hot' in config:
            self.encode_one_hot(**config['encode_one_hot'])
            
        if 'scale' in config:
            self.scale_features(**config['scale'])
            
        if 'feature_selection' in config:
            self.select_features(**config['feature_selection'])
            
        return self.df

    def get_dataframe(self):
        return self.df
