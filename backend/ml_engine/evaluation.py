import numpy as np
import pandas as pd
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_curve, auc, precision_recall_curve
)
import time

class ModelEvaluationEngine:
    def __init__(self, problem_type: str, models: dict, X_test: pd.DataFrame, y_test: pd.Series):
        self.problem_type = problem_type
        self.models = models
        self.X_test = X_test
        self.y_test = y_test

    def _extract_feature_importance(self, model, feature_names):
        importances = None
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        elif hasattr(model, 'coef_'):
            importances = np.abs(model.coef_)
            if len(importances.shape) > 1:
                importances = importances.mean(axis=0)
                
        if importances is not None and len(importances) == len(feature_names):
            feature_imp = list(zip(feature_names, importances.tolist()))
            feature_imp.sort(key=lambda x: x[1], reverse=True)
            return dict(feature_imp[:10])
        return None

    def evaluate(self):
        results = []
        feature_names = self.X_test.columns.tolist()
        
        for name, model in self.models.items():
            start_time = time.time()
            y_pred = model.predict(self.X_test)
            inference_time = time.time() - start_time
            
            feature_importance = self._extract_feature_importance(model, feature_names)
            
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
                pr_data = None
                
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
                        
                        prec, rec, _ = precision_recall_curve(self.y_test, y_prob)
                        pr_data = {
                            'precision': prec.tolist(),
                            'recall': rec.tolist()
                        }
                    except Exception:
                        pass
                    
                metrics = {
                    'accuracy': float(acc),
                    'precision': float(precision),
                    'recall': float(recall),
                    'f1': float(f1),
                    'confusion_matrix': cm
                }
                if roc_data:
                    metrics['roc'] = roc_data
                if pr_data:
                    metrics['pr_curve'] = pr_data
                    
            results.append({
                'model_name': name,
                'metrics': metrics,
                'inference_time': round(inference_time, 4),
                'feature_importance': feature_importance
            })
            
        if self.problem_type == 'regression':
            max_r2 = max(r['metrics']['r2'] for r in results) if results else 1
            min_time = min(r['inference_time'] for r in results) if results else 1
            
            for r in results:
                time_score = (min_time / max(r['inference_time'], 0.0001))
                r2_score_val = r['metrics']['r2'] / max_r2 if max_r2 > 0 else 0
                r['combined_score'] = (r2_score_val * 0.8) + (time_score * 0.2)
                
            results.sort(key=lambda x: x.get('combined_score', 0), reverse=True)
            reason = "Provides the best balance of high R2 score and low prediction latency."
        else:
            max_f1 = max(r['metrics']['f1'] for r in results) if results else 1
            min_time = min(r['inference_time'] for r in results) if results else 1
            
            for r in results:
                time_score = (min_time / max(r['inference_time'], 0.0001))
                f1_score_val = r['metrics']['f1'] / max_f1 if max_f1 > 0 else 0
                r['combined_score'] = (f1_score_val * 0.8) + (time_score * 0.2)
                
            results.sort(key=lambda x: x.get('combined_score', 0), reverse=True)
            reason = "Provides the best balance of high F1 Score and low prediction latency."
            
        for i, res in enumerate(results):
            res['rank'] = i + 1
            
        return {
            'problem_type': self.problem_type,
            'evaluation_results': results,
            'best_model': results[0]['model_name'] if results else None,
            'recommendation_reason': reason if results else None
        }
