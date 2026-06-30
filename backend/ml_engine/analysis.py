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

    def suggest_target_columns(self) -> List[str]:
        suggestions = []
        for col in self.df.columns:
            col_str = str(col)
            col_lower = col_str.lower()
            if col_lower in ['target', 'label', 'class', 'y', 'outcome', 'status']:
                suggestions.append(col_str)
                continue
                
            if pd.api.types.is_bool_dtype(self.df[col]):
                suggestions.append(col_str)
                continue
                
            if col_str in self.get_categorical_columns():
                unique_count = self.df[col].nunique()
                if 2 <= unique_count <= 20:
                    suggestions.append(col_str)
                    
        return list(set(suggestions))

    def detect_problem_type(self, target_column: str) -> str:
        if target_column not in self.df.columns:
            raise ValueError(f"Target column '{target_column}' not found in dataframe")
            
        dtype = self.df[target_column].dtype
        
        if pd.api.types.is_numeric_dtype(dtype):
            unique_count = self.df[target_column].nunique()
            if unique_count <= 20:
                return "Classification"
            return "Regression"
        else:
            return "Classification"
            
    def analyze(self, target_column: str = None) -> Dict[str, Any]:
        analysis = {
            "shape": self.get_shape(),
            "data_types": self.get_data_types(),
            "numerical_columns": self.get_numerical_columns(),
            "categorical_columns": self.get_categorical_columns(),
            "statistics": self.get_statistics(),
            "missing_values": self.get_missing_values(),
            "duplicates": self.get_duplicates(),
            "suggested_targets": self.suggest_target_columns(),
        }
        
        if target_column and target_column in self.df.columns:
            analysis["problem_type"] = self.detect_problem_type(target_column)
            
        return analysis
