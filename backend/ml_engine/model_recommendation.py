import logging
from typing import Dict, Any, List, Tuple
from ml_engine.model_registry import ModelRegistry

logger = logging.getLogger(__name__)

class ModelRecommendationEngine:
    """
    Intelligently recommends models from the ModelRegistry based on
    dataset profile characteristics and problem type.
    """
    
    def __init__(self, dataset_profile: dict, problem_type: str):
        self.profile = dataset_profile
        self.problem_type = problem_type
        
        dataset_meta = self.profile.get("dataset", {})
        self.rows = dataset_meta.get("rows", 0)
        self.cols = dataset_meta.get("columns", 0)
        
        # Determine presence of text or high cardinality for sparsity checks
        self.has_text = any(c.get("inferred_type") == "text" for c in self.profile.get("columns", {}).values())
        
    def recommend(self) -> dict:
        all_models = ModelRegistry.get_models()
        
        selected_models = []
        excluded_models = []
        
        # Determine dataset scale
        if self.rows < 1000:
            scale = "Small"
            budget = 3
        elif self.rows < 50000:
            scale = "Medium"
            budget = 4
        else:
            scale = "Large"
            budget = 3 # Keep budget tight for large datasets
            
        # Filter available models by problem type
        candidates = {
            name: meta for name, meta in all_models.items()
            if self.problem_type in meta["task_type"]
        }
        
        # Run heuristics
        for name, meta in candidates.items():
            if self._should_exclude(name, meta, scale):
                reason = self._get_exclusion_reason(name, meta, scale)
                excluded_models.append({
                    "name": name,
                    "reason": reason
                })
            else:
                reason = self._get_inclusion_reason(name, meta, scale)
                selected_models.append({
                    "name": name,
                    "reason": reason,
                    "priority": self._get_priority(name, meta, scale)
                })
                
        # Sort selected by priority (lower is better) and respect budget
        selected_models.sort(key=lambda x: x["priority"])
        
        # If we exceed budget, move lower priority to excluded
        if len(selected_models) > budget:
            for extra in selected_models[budget:]:
                excluded_models.append({
                    "name": extra["name"],
                    "reason": f"Excluded to respect training budget ({budget} models max for {scale} datasets)."
                })
            selected_models = selected_models[:budget]
            
        return {
            "scale": scale,
            "budget": budget,
            "selected_models": selected_models,
            "excluded_models": excluded_models,
            "estimated_cost": self._estimate_cost(scale, len(selected_models))
        }
        
    def _should_exclude(self, name: str, meta: dict, scale: str) -> bool:
        # Avoid Random Forest on very large datasets or highly sparse (text) data
        if meta["type"] == "tree_ensemble" and not meta["memory_efficient"]:
            if scale == "Large" or self.has_text:
                return True
                
        # If LightGBM is available, it heavily supersedes XGBoost for large tabular data
        if name.startswith("XGBoost") and scale == "Large" and "LightGBM Classifier" in ModelRegistry.get_models():
            return True
            
        return False
        
    def _get_exclusion_reason(self, name: str, meta: dict, scale: str) -> str:
        if meta["type"] == "tree_ensemble" and not meta["memory_efficient"]:
            if self.has_text:
                return "Excluded because Random Forest performs poorly on sparse text features."
            return "Excluded because it scales poorly memory-wise on large datasets."
            
        if name.startswith("XGBoost") and scale == "Large":
            return "Excluded in favor of LightGBM which is significantly faster for large data."
            
        return "Excluded due to sub-optimal fit for this dataset profile."
        
    def _get_inclusion_reason(self, name: str, meta: dict, scale: str) -> str:
        if name.startswith("Logistic") or name.startswith("Linear"):
            return "Recommended as a highly interpretable, fast linear baseline."
            
        if name.startswith("Random Forest"):
            return "Recommended as a robust nonlinear baseline less prone to overfitting."
            
        if name.startswith("LightGBM"):
            return "Recommended as a high-performance gradient boosting model optimized for large datasets."
            
        if name.startswith("XGBoost"):
            return "Recommended as a powerful gradient boosting model for structured data."
            
        return "Recommended as a strong candidate for this problem type."
        
    def _get_priority(self, name: str, meta: dict, scale: str) -> int:
        # Linear models always priority 1
        if meta["type"] == "linear":
            return 1
            
        # LightGBM priority 2 on large, 3 on small
        if name.startswith("LightGBM"):
            return 2 if scale == "Large" else 3
            
        # XGBoost priority 3
        if name.startswith("XGBoost"):
            return 3
            
        # Random Forest priority 2 on small/medium
        if name.startswith("Random Forest"):
            return 4 if scale == "Large" else 2
            
        return 5
        
    def _estimate_cost(self, scale: str, num_models: int) -> str:
        if scale == "Small":
            return "Low (Seconds)"
        elif scale == "Medium":
            return "Medium (Minutes)"
        return "High (Minutes to Hours)"
