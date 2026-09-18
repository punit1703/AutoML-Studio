import pandas as pd
import numpy as np
import os
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def sanitize_for_json(obj: Any) -> Any:
    if isinstance(obj, (np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    if isinstance(obj, (np.float64, np.float32, np.float16)):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return float(obj)
    if isinstance(obj, dict):
        return {str(k): sanitize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_for_json(v) for v in obj]
    if pd.isna(obj):
        return None
    return obj


class DatasetProfiler:
    """
    Central intelligence hub for dataset profiling.
    Generates a deeply structured JSON profile for downstream components.
    """
    
    def __init__(self, file_path: str, max_rows: int = 100000):
        self.file_path = file_path
        self.max_rows = max_rows
        
    def profile(self) -> dict:
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"Dataset file not found at {self.file_path}")
            
        file_size_mb = os.path.getsize(self.file_path) / (1024 * 1024)
        
        # Load dataset smartly
        df_full = self._load_data(limit=None if file_size_mb < 50 else self.max_rows)
        if df_full.empty:
            return {"error": "Dataset is empty or could not be loaded."}
            
        total_rows = len(df_full)
        is_sampled = file_size_mb >= 50
        
        profile = {
            "dataset": {
                "rows": total_rows, 
                "columns": len(df_full.columns),
                "size_mb": round(file_size_mb, 2),
                "is_sampled": is_sampled,
                "missing_pct": round((df_full.isnull().sum().sum() / df_full.size) * 100, 2) if df_full.size > 0 else 0,
                "duplicate_rows": int(df_full.duplicated().sum()),
                "duplicate_pct": round((df_full.duplicated().sum() / total_rows) * 100, 2) if total_rows > 0 else 0,
                "types_breakdown": {
                    "numeric": 0,
                    "categorical": 0,
                    "datetime": 0,
                    "boolean": 0,
                    "text": 0
                },
                "potential_identifiers": [],
                "constant_columns": []
            },
            "columns": {}
        }
        
        for col in df_full.columns:
            series = df_full[col]
            col_profile = self._profile_column(series, str(col))
            
            profile["columns"][str(col)] = col_profile
            
            inferred_type = col_profile["inferred_type"]
            profile["dataset"]["types_breakdown"][inferred_type] += 1
            
            if col_profile.get("is_identifier"):
                profile["dataset"]["potential_identifiers"].append(str(col))
                
            if col_profile["unique_count"] == 1:
                profile["dataset"]["constant_columns"].append(str(col))
                
        return sanitize_for_json(profile)
        
    def _load_data(self, limit=None) -> pd.DataFrame:
        ext = os.path.splitext(self.file_path)[1].lower()
        try:
            if ext == '.csv':
                return pd.read_csv(self.file_path, nrows=limit, engine='python', on_bad_lines='skip')
            elif ext == '.parquet':
                df = pd.read_parquet(self.file_path)
                return df.head(limit) if limit else df
            else:
                df = pd.read_excel(self.file_path, nrows=limit)
                return df
        except Exception as e:
            logger.error(f"Error loading dataset in profiler: {e}")
            return pd.DataFrame()
            
    def _profile_column(self, series: pd.Series, col_name: str) -> dict:
        total = len(series)
        missing = int(series.isnull().sum())
        missing_pct = round((missing / total) * 100, 2) if total > 0 else 0
        
        valid_series = series.dropna()
        valid_count = len(valid_series)
        unique_count = int(valid_series.nunique())
        unique_pct = round((unique_count / valid_count) * 100, 2) if valid_count > 0 else 0
        
        base_profile = {
            "name": col_name,
            "pandas_dtype": str(series.dtype),
            "non_null_count": valid_count,
            "missing_count": missing,
            "missing_pct": missing_pct,
            "unique_count": unique_count,
            "unique_pct": unique_pct,
            "is_identifier": False
        }
        
        if valid_count == 0:
            base_profile["inferred_type"] = "categorical"
            return base_profile
            
        inferred_type = self._infer_type(valid_series, col_name, unique_count, unique_pct)
        base_profile["inferred_type"] = inferred_type
        
        if inferred_type == "numeric":
            base_profile.update(self._analyze_numeric(pd.to_numeric(valid_series, errors='coerce').dropna()))
        elif inferred_type == "categorical" or inferred_type == "boolean":
            base_profile.update(self._analyze_categorical(valid_series))
            
        # Identifier Detection
        if unique_pct > 95 and inferred_type in ["numeric", "categorical", "text"] and total > 10:
            col_lower = col_name.lower()
            if any(k in col_lower for k in ["id", "index", "uuid", "guid"]):
                base_profile["is_identifier"] = True
            elif inferred_type == "numeric" and series.is_monotonic_increasing:
                base_profile["is_identifier"] = True
                
        return base_profile
        
    def _infer_type(self, series: pd.Series, col_name: str, unique_count: int, unique_pct: float) -> str:
        # 1. Boolean detection
        if pd.api.types.is_bool_dtype(series):
            return "boolean"
        if unique_count == 2:
            uniques = set(series.astype(str).str.lower().unique())
            if uniques.issubset({"0", "1", "0.0", "1.0"}) or uniques.issubset({"yes", "no"}) or uniques.issubset({"y", "n"}) or uniques.issubset({"true", "false"}):
                return "boolean"
                
        # 2. Numeric detection
        if pd.api.types.is_numeric_dtype(series):
            return "numeric"
            
        # 3. Datetime detection
        if pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"
            
        # Heuristic string-to-datetime coercion (sample to stay fast)
        sample = series.sample(min(100, len(series)))
        try:
            if sample.str.isnumeric().all():
                pass
            else:
                parsed_dates = pd.to_datetime(sample, errors='coerce', format='mixed')
                if parsed_dates.notnull().mean() > 0.8:
                    return "datetime"
        except Exception:
            pass
            
        # 4. Text vs Categorical
        if series.dtype == 'object' or pd.api.types.is_string_dtype(series):
            sample_strs = series.sample(min(100, len(series))).astype(str)
            avg_len = sample_strs.str.len().mean()
            
            if unique_pct > 90 and avg_len > 30:
                return "text"
            elif unique_pct > 50 and unique_count > 100:
                return "text"
            else:
                return "categorical"
                
        return "categorical"

    def _analyze_numeric(self, series: pd.Series) -> dict:
        if series.empty:
            return {}
        
        q1 = float(series.quantile(0.25))
        q3 = float(series.quantile(0.75))
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = int(((series < lower_bound) | (series > upper_bound)).sum())
        
        return {
            "min": float(series.min()),
            "max": float(series.max()),
            "mean": float(series.mean()),
            "median": float(series.median()),
            "std": float(series.std()) if len(series) > 1 else 0.0,
            "q25": q1,
            "q50": float(series.quantile(0.50)),
            "q75": q3,
            "skewness": float(series.skew()) if len(series) > 2 else 0.0,
            "outlier_count": outliers
        }
        
    def _analyze_categorical(self, series: pd.Series) -> dict:
        value_counts = series.value_counts(normalize=False)
        total_valid = len(series)
        
        rare_count = int((value_counts < (total_valid * 0.01)).sum())
        rare_pct = round((rare_count / len(value_counts)) * 100, 2) if len(value_counts) > 0 else 0
        
        top_cats = value_counts.head(10).to_dict()
        top_cats_str = {str(k): int(v) for k, v in top_cats.items()}
        
        return {
            "most_frequent": str(value_counts.index[0]) if not value_counts.empty else None,
            "frequency_distribution": top_cats_str,
            "rare_category_pct": rare_pct
        }
