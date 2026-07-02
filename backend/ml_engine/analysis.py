import pandas as pd
import numpy as np
from typing import Dict, Any, List

class DatasetAnalysisEngine:
    """
    Engine to analyze dataset and extract metadata, statistics,
    and suggest ML problem types and targets.
    """
    
    def __init__(self, df: pd.DataFrame):
        self.df = df
        
    def get_shape(self) -> Dict[str, int]:
        return {
            "rows": self.df.shape[0],
            "columns": self.df.shape[1]
        }
        
    def get_data_types(self) -> Dict[str, str]:
        types = {}
        for col, dtype in self.df.dtypes.items():
            if pd.api.types.is_numeric_dtype(dtype):
                types[str(col)] = "numerical"
            elif pd.api.types.is_datetime64_any_dtype(dtype):
                types[str(col)] = "datetime"
            elif pd.api.types.is_bool_dtype(dtype):
                types[str(col)] = "boolean"
            else:
                types[str(col)] = "categorical"
        return types

    def get_numerical_columns(self) -> List[str]:
        return [str(col) for col in self.df.select_dtypes(include=[np.number]).columns.tolist()]
        
    def get_categorical_columns(self) -> List[str]:
        return [str(col) for col in self.df.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()]

    def get_statistics(self) -> Dict[str, Dict[str, float]]:
        # Get statistics for numerical columns
        desc = self.df.describe()
        # Replace NaN with None for JSON serialization
        desc = desc.where(pd.notnull(desc), None)
        return {str(k): v for k, v in desc.to_dict().items()}

    def get_missing_values(self) -> Dict[str, int]:
        return {str(k): int(v) for k, v in self.df.isnull().sum().to_dict().items()}

    def get_duplicates(self) -> int:
        return int(self.df.duplicated().sum())

    def suggest_target_columns(self) -> Dict[str, int]:
        suggestions = {}
        total_rows = self.df.shape[0]
        
        for col in self.df.columns:
            col_str = str(col)
            col_lower = col_str.lower()
            confidence = 0
            
            # 1. Naming conventions
            if any(keyword in col_lower for keyword in ['target', 'label', 'class', 'outcome', 'status']):
                confidence += 50
            if col_lower == 'y':
                confidence += 80
                
            # 2. Missing values check
            missing_ratio = self.df[col].isnull().sum() / total_rows
            if missing_ratio > 0.5:
                continue # Target shouldn't have >50% missing values
            elif missing_ratio > 0:
                confidence -= int(missing_ratio * 100) # Penalize slightly
                
            # 3. Data types and unique values
            unique_count = self.df[col].nunique()
            if unique_count == 1:
                continue # A constant column cannot be a target
                
            if pd.api.types.is_bool_dtype(self.df[col]):
                confidence += 40
            elif pd.api.types.is_numeric_dtype(self.df[col]):
                unique_ratio = unique_count / total_rows
                if unique_count == 2:
                    confidence += 40 # Binary classification
                elif unique_count <= 20:
                    confidence += 20 # Multi-class classification
                elif unique_ratio > 0.8:
                    # IDs and timestamps are highly unique, bad targets usually
                    if any(kw in col_lower for kw in ['id', 'time', 'date', 'index']):
                        continue
                    confidence += 10 # Regression
                else:
                    confidence += 30 # Regression
            else:
                # Categorical strings
                if 2 <= unique_count <= 20:
                    confidence += 40
                else:
                    continue # High cardinality strings are bad targets
                    
            if confidence > 0:
                suggestions[col_str] = min(confidence, 99)
                
        # Sort by confidence descending
        return dict(sorted(suggestions.items(), key=lambda item: item[1], reverse=True))

    def detect_problem_type(self, target_column: str) -> str:
        if target_column not in self.df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataframe")
            
        dtype = self.df[target_column].dtype
        unique_count = self.df[target_column].nunique()
        total_rows = self.df.shape[0]
        
        if pd.api.types.is_numeric_dtype(dtype):
            unique_ratio = unique_count / total_rows
            
            # Check if it's float, float targets are almost always regression unless they are just 0.0 and 1.0
            if pd.api.types.is_float_dtype(dtype) and unique_count > 5:
                return "Regression"
                
            if unique_count <= 20:
                return "Classification"
            elif unique_ratio < 0.05 and unique_count < 100:
                return "Classification" # Lots of rows, but few unique integer values
            else:
                return "Regression"
        else:
            return "Classification"
            
    def calculate_quality_score(self) -> Dict[str, Any]:
        total_cells = self.df.size
        total_missing = self.df.isnull().sum().sum()
        missing_pct = (total_missing / total_cells) * 100 if total_cells > 0 else 0
        
        total_rows = self.df.shape[0]
        duplicate_pct = (self.df.duplicated().sum() / total_rows) * 100 if total_rows > 0 else 0
        
        # Simple outlier detection (values > 3 std dev from mean) for numerics
        outlier_count = 0
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            mean = self.df[col].mean()
            std = self.df[col].std()
            if pd.notna(mean) and pd.notna(std) and std > 0:
                outliers = self.df[(self.df[col] < mean - 3 * std) | (self.df[col] > mean + 3 * std)]
                outlier_count += len(outliers)
                
        outlier_pct = (outlier_count / total_cells) * 100 if total_cells > 0 else 0
        
        # Calculate base score
        score = 100
        score -= min(missing_pct * 1.5, 40) # Max 40% penalty for missing
        score -= min(duplicate_pct, 20) # Max 20% penalty for duplicates
        score -= min(outlier_pct * 2, 20) # Max 20% penalty for outliers
        
        return {
            "score": max(round(score, 1), 0),
            "missing_pct": round(missing_pct, 2),
            "duplicate_pct": round(duplicate_pct, 2),
            "outlier_pct": round(outlier_pct, 2)
        }

    def generate_preprocessing_suggestions(self, quality: Dict[str, Any], target_column: str = None) -> List[Dict[str, str]]:
        suggestions = []
        
        if quality["missing_pct"] > 0:
            if quality["missing_pct"] > 30:
                suggestions.append({"issue": f"High missing values ({quality['missing_pct']}%)", "recommendation": "Consider dropping columns with >50% missing values or using advanced imputation like KNN."})
            else:
                suggestions.append({"issue": f"Missing values detected", "recommendation": "Use Median imputation for skewed numeric columns and Mode for categoricals."})
                
        if quality["duplicate_pct"] > 5:
            suggestions.append({"issue": f"Duplicate rows ({quality['duplicate_pct']}%)", "recommendation": "Remove duplicate rows to prevent data leakage and overfitting."})
            
        if quality["outlier_pct"] > 2:
            suggestions.append({"issue": f"Significant outliers ({quality['outlier_pct']}%)", "recommendation": "Apply Robust Scaler or clip outliers to the 5th/95th percentiles to stabilize model training."})
            
        if target_column and target_column in self.df.columns:
            if self.detect_problem_type(target_column) == "Classification":
                class_counts = self.df[target_column].value_counts(normalize=True)
                if not class_counts.empty and class_counts.min() < 0.2:
                    suggestions.append({"issue": f"Class imbalance detected", "recommendation": f"The minority class represents only {round(class_counts.min() * 100, 1)}%. Use SMOTE or Balanced Class Weights to prevent bias."})
                    
        return suggestions

    def analyze(self, target_column: str = None) -> Dict[str, Any]:
        quality = self.calculate_quality_score()
        
        analysis = {
            "shape": self.get_shape(),
            "data_types": self.get_data_types(),
            "numerical_columns": self.get_numerical_columns(),
            "categorical_columns": self.get_categorical_columns(),
            "statistics": self.get_statistics(),
            "missing_values": self.get_missing_values(),
            "duplicates": self.get_duplicates(),
            "suggested_targets": self.suggest_target_columns(),
            "quality_score": quality,
            "preprocessing_suggestions": self.generate_preprocessing_suggestions(quality, target_column)
        }
        
        if target_column and target_column in self.df.columns:
            analysis["problem_type"] = self.detect_problem_type(target_column)
            
        return analysis
