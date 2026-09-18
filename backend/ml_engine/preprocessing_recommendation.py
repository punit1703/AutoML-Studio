import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class PreprocessingRecommendationEngine:
    """
    Engine to recommend a dataset-aware preprocessing plan using the JSON profile.
    This plan dictates how the PipelineBuilder will construct the scikit-learn pipeline.
    """
    
    def __init__(self, dataset_profile: dict, target_column: str):
        self.profile = dataset_profile
        self.target_column = target_column
        self.columns_meta = self.profile.get("columns", {})
        
    def generate_plan(self) -> Dict[str, Any]:
        plan = {}
        
        for col_name, col_meta in self.columns_meta.items():
            if col_name == self.target_column:
                # The target column is handled separately by the training loop, not the feature pipeline.
                plan[col_name] = {
                    "type": "target",
                    "action": "exclude",
                    "reason": f"Target column '{col_name}' is excluded from feature preprocessing to prevent data leakage.",
                    "warnings": []
                }
                continue
                
            plan[col_name] = self._recommend_for_column(col_name, col_meta)
            
        return plan
        
    def _recommend_for_column(self, col_name: str, col_meta: dict) -> dict:
        inferred_type = col_meta.get("inferred_type", "categorical")
        unique_count = col_meta.get("unique_count", 0)
        unique_pct = col_meta.get("unique_pct", 0.0)
        missing_pct = col_meta.get("missing_pct", 0.0)
        is_identifier = col_meta.get("is_identifier", False)
        
        rec = {
            "type": inferred_type,
            "action": "include",
            "missing": "none",
            "encoding": "none",
            "scaling": "none",
            "reason": "",
            "warnings": []
        }
        
        # 1. Constant Column
        if unique_count <= 1:
            rec["action"] = "exclude"
            rec["reason"] = f"Column has only {unique_count} unique value(s) and provides no predictive power."
            return rec
            
        # 2. Identifiers
        if is_identifier:
            rec["action"] = "exclude"
            rec["reason"] = "Detected as a unique identifier (ID) which causes overfitting."
            return rec
            
        # 3. Near-Constant (Highly skewed)
        if unique_count == 2 and col_meta.get("rare_category_pct", 0) > 95:
            rec["warnings"].append("Near-constant column: one class dominates heavily.")
            
        # 4. Leakage Detection Heuristic
        if any(leak in col_name.lower() for leak in ['post_', '_after', 'future']):
            rec["warnings"].append("Potential data leakage detected from naming convention.")

        # Determine Missing Strategy
        if missing_pct > 50:
            rec["warnings"].append(f"High missing values ({missing_pct}%). Imputation might be unreliable.")
            
        if missing_pct > 0:
            if inferred_type == "numeric":
                rec["missing"] = "median"
                rec["reason"] += f"{missing_pct}% missing values imputed with median. "
            else:
                rec["missing"] = "most_frequent"
                rec["reason"] += f"{missing_pct}% missing values imputed with most frequent category. "
                
        # Type Specific Recommendations
        if inferred_type == "numeric":
            skewness = col_meta.get("skewness", 0.0)
            if abs(skewness) > 1.5:
                rec["scaling"] = "robust"
                rec["reason"] += "RobustScaler recommended due to high skewness or outliers."
                if col_meta.get("outlier_count", 0) > (col_meta.get("non_null_count", 0) * 0.05):
                     rec["warnings"].append(f"Contains significant outliers ({col_meta.get('outlier_count')} detected).")
            else:
                rec["scaling"] = "standard"
                rec["reason"] += "StandardScaler recommended for numeric normalization."
                
        elif inferred_type in ["categorical", "boolean"]:
            if inferred_type == "boolean" or unique_count == 2:
                rec["encoding"] = "ordinal"
                rec["reason"] += "Binary categorical encoded as 0/1."
            elif unique_count <= 10:
                rec["encoding"] = "one_hot"
                rec["reason"] += "Low cardinality categorical recommended for OneHot encoding."
            else:
                rec["encoding"] = "target" # Target encoding or frequency encoding for high cardinality
                rec["reason"] += "High cardinality categorical recommended for Target/Ordinal encoding."
                
        elif inferred_type == "datetime":
            rec["action"] = "extract_datetime"
            rec["reason"] += "Datetime components (Year, Month, Day, DayOfWeek) will be extracted."
            
        elif inferred_type == "text":
            rec["encoding"] = "tfidf"
            rec["reason"] += "Free-form text recommended for TF-IDF vectorization (max_features=100)."
            
        if not rec["reason"]:
            rec["reason"] = "Standard passthrough pipeline."
            
        return rec
