import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc
)

class ModelEvaluationEngine:
    def __init__(self, problem_type: str, models: dict, X_test: pd.DataFrame, y_test: pd.Series):
        self.problem_type = problem_type
        self.models = models
        self.X_test = X_test
        self.y_test = y_test

    def evaluate(self):
        results = []
        for name, model in self.models.items():
            y_pred = model.predict(self.X_test)
            
            metrics = {}
            if self.problem_type == 'regression':
                mae = mean_absolute_error(self.y_test, y_pred)
                rmse = np.sqrt(mean_squared_error(self.y_test, y_pred))
                r2 = r2_score(self.y_test, y_pred)
                
                metrics = {
                    'mae': float(mae),
                    'rmse': float(rmse),
                    'r2': float(r2)
                }
            else:
                acc = accuracy_score(self.y_test, y_pred)
                precision = precision_score(self.y_test, y_pred, average='weighted', zero_division=0)
                recall = recall_score(self.y_test, y_pred, average='weighted', zero_division=0)
                f1 = f1_score(self.y_test, y_pred, average='weighted', zero_division=0)
                
                cm = confusion_matrix(self.y_test, y_pred).tolist()
                
                roc_data = None
                # Check if binary classification and model supports probabilities
                unique_classes = np.unique(self.y_test)
                if len(unique_classes) == 2 and hasattr(model, 'predict_proba'):
                    try:
                        y_prob = model.predict_proba(self.X_test)[:, 1]
                        fpr, tpr, _ = roc_curve(self.y_test, y_prob)
                        roc_auc = auc(fpr, tpr)
                        roc_data = {
                            'fpr': fpr.tolist(),
                            'tpr': tpr.tolist(),
                            'auc': float(roc_auc)
                        }
                    except Exception:
                        pass # Ignore if roc calculation fails
                    
                metrics = {
                    'accuracy': float(acc),
                    'precision': float(precision),
                    'recall': float(recall),
                    'f1': float(f1),
                    'confusion_matrix': cm
                }
                if roc_data:
                    metrics['roc'] = roc_data
                    
            results.append({
                'model_name': name,
                'metrics': metrics
            })
            
        # Rank and find best model
        if self.problem_type == 'regression':
            # sort by r2 descending, rmse ascending
            results.sort(key=lambda x: (-x['metrics']['r2'], x['metrics']['rmse']))
        else:
            # sort by accuracy and f1 descending
            results.sort(key=lambda x: (-x['metrics']['accuracy'], -x['metrics']['f1']))
            
        # Add rank
        for i, res in enumerate(results):
            res['rank'] = i + 1
            
        return {
            'problem_type': self.problem_type,
            'evaluation_results': results,
            'best_model': results[0]['model_name'] if results else None
        }
