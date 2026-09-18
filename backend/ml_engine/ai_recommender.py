import os
import json
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from django.conf import settings
from openai import OpenAI

class PreprocessingStrategy(BaseModel):
    numeric_imputation: str = Field(description="Strategy for numeric missing values (mean, median, knn)")
    categorical_imputation: str = Field(description="Strategy for categorical missing values (most_frequent, constant)")
    encoding: str = Field(description="Encoding strategy (one_hot, label)")
    scaling: str = Field(description="Scaling strategy (standard, min_max, robust)")

class AIDecisionResponse(BaseModel):
    problem_type: str = Field(description="Problem type: 'classification' or 'regression'")
    target_column: Optional[str] = Field(description="The recommended target column if none was provided")
    preprocessing: PreprocessingStrategy = Field(description="Recommended preprocessing strategies")
    visualizations: List[str] = Field(description="List of useful visualizations (e.g., class_distribution, correlation_heatmap)")
    candidate_models: List[str] = Field(description="List of recommended models (e.g., Random Forest, XGBoost)")
    validation_strategy: str = Field(description="Recommended validation strategy (e.g., stratified_5_fold)")
    optimization_strategy: str = Field(description="Recommended optimization strategy (e.g., optuna)")

class AIDecisionEngine:
    def __init__(self):
        self.api_key = os.getenv('AI_API_KEY')
        if not self.api_key:
            print("Warning: AI_API_KEY not found in environment. AI Decision Engine will use fallback rules.")
            self.client = None
        else:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url="https://api.x.ai/v1",
            )

    def recommend(self, metadata: dict) -> dict:
        if not self.client:
            return self._fallback_recommendation(metadata)
            
        prompt = f"""
        Analyze the following dataset metadata and recommend a complete Machine Learning strategy.
        Dataset Metadata:
        {json.dumps(metadata, indent=2)}
        
        Respond with structured JSON data exactly matching the requested schema. Ensure models are appropriate for the data size and types.
        """
        
        try:
            # Note: At this time xAI Grok does not have a formal structured output feature equivalent to Gemini/OpenAI parsed responses via SDK.
            # We will request JSON mode or parse standard text.
            response = self.client.chat.completions.create(
                model="grok-2-latest",
                messages=[
                    {"role": "system", "content": "You are a senior data scientist. Always respond in valid JSON format according to the schema: " + AIDecisionResponse.model_json_schema() + ". Output NOTHING else but JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
            )
            
            content = response.choices[0].message.content
            # Strip potential markdown blocks
            if content.startswith("```json"):
                content = content.split("```json")[1].split("```")[0].strip()
            elif content.startswith("```"):
                content = content.split("```")[1].split("```")[0].strip()
                
            return json.loads(content)
        except Exception as e:
            print(f"AI API failed: {str(e)}")
            return self._fallback_recommendation(metadata)

    def _fallback_recommendation(self, metadata: dict) -> dict:
        # Deterministic fallback if API fails or is not configured
        target_candidates = [col for col in metadata.get('columns', []) if col.lower() in ['target', 'class', 'label', 'price', 'status']]
        target_column = target_candidates[0] if target_candidates else metadata.get('columns', [''])[0]
        
        problem_type = 'classification'
        if target_column in metadata.get('unique_counts', {}):
            unique = metadata['unique_counts'][target_column]
            if unique > 20:
                problem_type = 'regression'
        elif target_column in metadata.get('numerical_columns', []):
             problem_type = 'regression'
                
        return {
          "problem_type": problem_type,
          "target_column": target_column,
          "preprocessing": {
            "numeric_imputation": "median",
            "categorical_imputation": "most_frequent",
            "encoding": "one_hot",
            "scaling": "standard"
          },
          "visualizations": [
            "class_distribution",
            "correlation_heatmap"
          ],
          "candidate_models": [
            "Random Forest",
            "Logistic Regression" if problem_type == 'classification' else "Linear Regression",
            "XGBoost"
          ],
          "validation_strategy": "stratified_3_fold",
          "optimization_strategy": "optuna"
        }
