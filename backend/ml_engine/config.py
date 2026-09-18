class ModelSelectionConfig:
    """
    Configuration for AutoML budget levels.
    Controls CV splits, search iterations, and dataset sampling limits.
    """
    
    BUDGET_LEVELS = {
        "fast": {
            "cv_splits": 2,
            "max_models": 2,
            "search_budget": 5, # Optuna trials
            "max_rows": 5000,
            "timeout_per_model": 60 # seconds
        },
        "standard": {
            "cv_splits": 3,
            "max_models": 4,
            "search_budget": 15,
            "max_rows": 50000,
            "timeout_per_model": 300
        },
        "thorough": {
            "cv_splits": 5,
            "max_models": 10,
            "search_budget": 50,
            "max_rows": 500000, # Allows very large datasets to train fully
            "timeout_per_model": 1800
        }
    }
    
    @classmethod
    def get_config(cls, budget: str) -> dict:
        budget = budget.lower()
        if budget not in cls.BUDGET_LEVELS:
            budget = "standard"
        return cls.BUDGET_LEVELS[budget]
