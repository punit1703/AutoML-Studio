import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler, RobustScaler
from sklearn.feature_selection import SelectKBest, f_classif, f_regression
from sklearn.impute import KNNImputer
from imblearn.over_sampling import SMOTE
from scipy import stats

class DataPreprocessingEngine:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()

    def handle_missing_values(self, strategy='mean', fill_value=None, columns=None, n_neighbors=5):
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
        elif strategy == 'knn':
            numeric_cols = self.df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                imputer = KNNImputer(n_neighbors=n_neighbors)
                self.df[numeric_cols] = imputer.fit_transform(self.df[numeric_cols])
            
        return self

    def remove_duplicates(self):
        self.df.drop_duplicates(inplace=True)
        self.df.reset_index(drop=True, inplace=True)
        return self
        
    def drop_unnecessary_columns(self):
        # Drop identifiers, timestamps, etc that shouldn't be used for ML
        blacklist = ['id', 'uuid', 'index', 'serial', 'timestamp', 'created', 'updated']
        cols_to_drop = []
        for col in self.df.columns:
            name_lower = col.lower()
            is_id = any(term in name_lower for term in blacklist) or name_lower.endswith('id')
            is_datetime = 'datetime' in str(self.df[col].dtype) or 'date' in name_lower
            
            # Also drop constant columns
            nunique = self.df[col].nunique()
            
            is_text_feature = False
            if self.df[col].dtype == 'object':
                non_null_vals = self.df[col].dropna().astype(str)
                if not non_null_vals.empty and non_null_vals.str.len().mean() > 30:
                    is_text_feature = True

            if is_id or is_datetime or nunique < 2 or (nunique == len(self.df) and self.df[col].dtype == 'object' and not is_text_feature):
                cols_to_drop.append(col)
                
        if cols_to_drop:
            self.df.drop(columns=cols_to_drop, inplace=True, errors='ignore')
        return self
        
    def encode_labels(self, columns=None):
        if columns is None:
            columns = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
        if columns:
            for col in columns:
                if col in self.df.columns:
                    le = LabelEncoder()
                    self.df[col] = le.fit_transform(self.df[col].astype(str))
        return self
        
    def encode_one_hot(self, columns=None, max_cardinality=100):
        if columns is None:
            columns = self.df.select_dtypes(include=['object', 'category']).columns.tolist()
        if columns:
            existing_cols = [col for col in columns if col in self.df.columns]
            to_encode = []
            for col in existing_cols:
                if self.df[col].nunique() > max_cardinality:
                    # Drop high-cardinality categorical variables safely instead of crashing OHE
                    self.df.drop(columns=[col], inplace=True)
                else:
                    to_encode.append(col)
                    
            if to_encode:
                self.df = pd.get_dummies(self.df, columns=to_encode, drop_first=True, dummy_na=True)
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

    def apply_smote(self, target_column):
        if target_column not in self.df.columns:
            return self
            
        self.df = self.df.dropna(subset=[target_column])
        
        class_counts = self.df[target_column].value_counts(normalize=True)
        if class_counts.empty or class_counts.min() > 0.2:
            return self 
            
        X = self.df.drop(columns=[target_column])
        y = self.df[target_column]
        
        # SMOTE requires numeric and no missing
        if X.isnull().values.any() or not all(pd.api.types.is_numeric_dtype(X[col]) for col in X.columns):
            return self
            
        try:
            smote = SMOTE(random_state=42)
            X_res, y_res = smote.fit_resample(X, y)
            self.df = pd.concat([X_res, y_res], axis=1)
        except Exception:
            pass # Fails gracefully if SMOTE fails (e.g. n_neighbors > n_samples)
            
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
        target_column = config.get('target_column')
        target_series = None
        
        # 1. Isolate Target Column
        if target_column and target_column in self.df.columns:
            target_series = self.df.pop(target_column)

        # 2. Always drop unnecessary columns first to clean up the data for ML
        self.drop_unnecessary_columns()
        
        if config.get('remove_duplicates'):
            # If removing duplicates, we MUST include the target to keep rows aligned,
            # but wait, if we remove duplicates based on features, we might drop rows
            # where target is different. Standard practice: remove duplicates on full dataframe.
            if target_series is not None:
                self.df[target_column] = target_series
            self.remove_duplicates()
            if target_series is not None:
                target_series = self.df.pop(target_column)
            
        if 'missing_values' in config:
            self.handle_missing_values(**config['missing_values'])
            
        if 'outliers' in config:
            # Similar to duplicates, dropping outliers will drop rows.
            # We must rejoin target to drop rows simultaneously, then pop it again.
            if target_series is not None:
                self.df[target_column] = target_series
            
            action = config['outliers'].get('action', 'drop')
            self.detect_outliers(**config['outliers'])
            
            if target_series is not None:
                target_series = self.df.pop(target_column)
            
        if 'encode_labels' in config:
            self.encode_labels(**config['encode_labels'])
            
        if 'encode_one_hot' in config:
            self.encode_one_hot(**config['encode_one_hot'])
            
        if 'scale' in config:
            self.scale_features(**config['scale'])
            
        # 3. Rejoin Target Column before feature selection / SMOTE
        if target_series is not None:
            self.df[target_column] = target_series
            
        if 'feature_selection' in config:
            # feature selection handles the target internally
            self.select_features(**config['feature_selection'])
            
        if 'smote' in config and config['smote']:
            if target_column:
                self.apply_smote(target_column)
            
        return self.df

    def get_dataframe(self):
        return self.df
