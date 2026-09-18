import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_curve, auc, confusion_matrix,
    mean_squared_error, mean_absolute_error, r2_score
)
from imblearn.metrics import geometric_mean_score

class ModelEvaluator:
    """
    Evaluates machine learning models and produces a consistent schema of 
    metrics, primary metric selection, and visual diagnostic arrays.
    """
    
    def __init__(self, problem_type: str, label_classes=None):
        self.problem_type = problem_type
        self.label_classes = label_classes
        self.is_regression = problem_type == "Regression"
        
    def evaluate(self, model, X_test, y_test):
        if self.is_regression:
            return self._evaluate_regression(model, X_test, y_test)
        else:
            return self._evaluate_classification(model, X_test, y_test)
            
    def _extract_feature_importance(self, model, X_test):
        importances = []
        try:
            # If the model is a pipeline, get the final estimator
            estimator = model.steps[-1][1] if hasattr(model, 'steps') else model
            
            # Trees
            if hasattr(estimator, 'feature_importances_'):
                importances = estimator.feature_importances_.tolist()
            # Linear models
            elif hasattr(estimator, 'coef_'):
                coefs = estimator.coef_
                if len(coefs.shape) > 1:
                    # Multiclass, take mean absolute coef across classes
                    importances = np.mean(np.abs(coefs), axis=0).tolist()
                else:
                    importances = np.abs(coefs).tolist()
                    
            if not importances:
                return None
                
            # Try to get feature names if the previous step is a preprocessor
            feature_names = []
            if hasattr(model, 'steps') and len(model.steps) > 1:
                preprocessor = model.steps[0][1]
                if hasattr(preprocessor, 'get_feature_names_out'):
                    feature_names = preprocessor.get_feature_names_out().tolist()
                    
            # Fallback names
            if len(feature_names) != len(importances):
                feature_names = [f"Feature {i}" for i in range(len(importances))]
                
            # Pair them and sort
            paired = list(zip(feature_names, importances))
            paired.sort(key=lambda x: x[1], reverse=True)
            
            # Return top 20
            return paired[:20]
        except Exception as e:
            return None

    def _evaluate_regression(self, model, X_test, y_test):
        y_pred = model.predict(X_test)
        
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Primary Metric
        primary_metric = "r2"
        primary_score = r2
        
        # Diagnostics
        # Limit to 500 points for frontend scatter plot
        sample_size = min(len(y_test), 500)
        idx = np.random.choice(len(y_test), sample_size, replace=False) if len(y_test) > sample_size else np.arange(len(y_test))
        
        actual_vs_predicted = [
            {"actual": float(a), "predicted": float(p), "residual": float(a - p)} 
            for a, p in zip(np.array(y_test)[idx], np.array(y_pred)[idx])
        ]
        
        feature_importance = self._extract_feature_importance(model, X_test)
        
        return {
            "primary_metric": primary_metric,
            "primary_score": float(primary_score),
            "metrics": {
                "rmse": float(rmse),
                "mae": float(mae),
                "r2": float(r2)
            },
            "diagnostics": {
                "actual_vs_predicted": actual_vs_predicted,
                "feature_importance": feature_importance
            }
        }

    def _evaluate_classification(self, model, X_test, y_test):
        y_pred = model.predict(X_test)
        
        # Multiclass vs Binary
        is_multiclass = len(self.label_classes) > 2 if self.label_classes else len(np.unique(y_test)) > 2
        avg_type = 'weighted' if is_multiclass else 'binary'
        
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average=avg_type, zero_division=0)
        rec = recall_score(y_test, y_pred, average=avg_type, zero_division=0)
        f1 = f1_score(y_test, y_pred, average=avg_type, zero_division=0)
        
        # Calculate imbalance
        class_counts = np.bincount(y_test) if np.issubdtype(np.array(y_test).dtype, np.integer) else np.unique(y_test, return_counts=True)[1]
        is_imbalanced = np.max(class_counts) / np.sum(class_counts) > 0.8
        
        if is_imbalanced:
            primary_metric = "f1"
            primary_score = f1
        else:
            primary_metric = "accuracy"
            primary_score = acc
            
        metrics = {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1": float(f1)
        }
        
        # ROC AUC
        diagnostics = {}
        if hasattr(model, "predict_proba"):
            try:
                y_prob = model.predict_proba(X_test)
                if not is_multiclass:
                    y_prob_positive = y_prob[:, 1]
                    fpr, tpr, _ = roc_curve(y_test, y_prob_positive)
                    roc_auc = auc(fpr, tpr)
                    metrics["roc_auc"] = float(roc_auc)
                    
                    # Store 50 points for ROC curve plotting
                    if len(fpr) > 50:
                        idx = np.linspace(0, len(fpr)-1, 50, dtype=int)
                        fpr = fpr[idx]
                        tpr = tpr[idx]
                        
                    diagnostics["roc_curve"] = [{"fpr": float(f), "tpr": float(t)} for f, t in zip(fpr, tpr)]
            except Exception:
                pass
                
        # Confusion Matrix
        cm = confusion_matrix(y_test, y_pred)
        diagnostics["confusion_matrix"] = cm.tolist()
        if self.label_classes:
            diagnostics["classes"] = list(self.label_classes)
            
        diagnostics["feature_importance"] = self._extract_feature_importance(model, X_test)
        
        return {
            "primary_metric": primary_metric,
            "primary_score": float(primary_score),
            "metrics": metrics,
            "diagnostics": diagnostics
        }
