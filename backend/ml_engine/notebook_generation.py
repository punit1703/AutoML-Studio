import json
import os

class NotebookGenerator:
    def __init__(self, dataset_path: str, target_column: str, output_dir: str):
        self.dataset_path = dataset_path
        self.target_column = target_column
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        
    def _create_markdown_cell(self, text: str):
        return {
            "cell_type": "markdown",
            "metadata": {},
            "source": [line + "\n" for line in text.split("\n")]
        }
        
    def _create_code_cell(self, code: str):
        return {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [line + "\n" for line in code.split("\n")]
        }

    def generate(self) -> str:
        filename = "reproducible_pipeline.ipynb"
        output_path = os.path.join(self.output_dir, filename)
        
        cells = []
        
        cells.append(self._create_markdown_cell("# AutoML Studio - Educational Pipeline\nWelcome to your reproducible AutoML notebook! This document is designed to not only train your model but explain *why* each step is taken. You can run this notebook locally to experiment with the baseline model."))
        
        cells.append(self._create_code_cell("import pandas as pd\nimport numpy as np\nimport matplotlib.pyplot as plt\nimport seaborn as sns\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.metrics import mean_squared_error, r2_score, accuracy_score, f1_score\nfrom sklearn.preprocessing import LabelEncoder\nfrom sklearn.ensemble import RandomForestRegressor, RandomForestClassifier\nimport joblib\nimport shap"))
        
        cells.append(self._create_markdown_cell("## 1. Data Loading\nFirst, we load the dataset into a pandas DataFrame. Inspecting the first few rows helps verify that the data parsed correctly."))
        
        load_code = f"dataset_path = r'{self.dataset_path}'\n" \
                    f"df = pd.read_csv(dataset_path)\n" \
                    f"df.head()"
        cells.append(self._create_code_cell(load_code))
        
        cells.append(self._create_markdown_cell("## 2. Target Isolation & Preprocessing\nMachine learning models require a target variable to predict (`y`) and features to learn from (`X`). We must also handle missing values, as most algorithms cannot process NaNs natively.\n\nHere, we use a simple mean imputation strategy for continuous variables."))
        
        prep_code = f"target_col = '{self.target_column}'\n" \
                    f"X = df.drop(columns=[target_col])\n" \
                    f"y = df[target_col]\n\n" \
                    f"numeric_cols = X.select_dtypes(include=[np.number]).columns\n" \
                    f"X = X[numeric_cols]\n" \
                    f"X = X.fillna(X.mean())\n\n" \
                    f"valid_idx = y.dropna().index\n" \
                    f"X = X.loc[valid_idx]\n" \
                    f"y = y.loc[valid_idx]\n\n" \
                    f"X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)\n" \
                    f"print(f'Training features shape: {{X_train.shape}}')\n" \
                    f"print(f'Testing features shape: {{X_test.shape}}')"
        cells.append(self._create_code_cell(prep_code))
        
        cells.append(self._create_markdown_cell("## 3. Model Training\nWe train a baseline Random Forest model. Random Forests are powerful, robust to outliers, and handle non-linear relationships well without extensive feature scaling."))
        
        train_code = "if pd.api.types.is_numeric_dtype(y) and y.nunique() > 20:\n" \
                     "    print('Task: Regression')\n" \
                     "    model = RandomForestRegressor(n_estimators=100, random_state=42)\n" \
                     "    model.fit(X_train, y_train)\n" \
                     "    preds = model.predict(X_test)\n" \
                     "    print(f'R2 Score: {r2_score(y_test, preds):.4f}')\n" \
                     "else:\n" \
                     "    print('Task: Classification')\n" \
                     "    le = LabelEncoder()\n" \
                     "    y_train = le.fit_transform(y_train)\n" \
                     "    y_test = le.transform(y_test)\n" \
                     "    model = RandomForestClassifier(n_estimators=100, random_state=42)\n" \
                     "    model.fit(X_train, y_train)\n" \
                     "    preds = model.predict(X_test)\n" \
                     "    print(f'Accuracy: {accuracy_score(y_test, preds):.4f}')"
        cells.append(self._create_code_cell(train_code))
        
        cells.append(self._create_markdown_cell("## 4. Explainability (SHAP)\nModel predictions shouldn't be a black box. We use SHAP (SHapley Additive exPlanations) to interpret the impact of each feature on the model's output."))
        
        shap_code = "try:\n" \
                    "    explainer = shap.TreeExplainer(model)\n" \
                    "    shap_values = explainer.shap_values(X_test)\n" \
                    "    shap.summary_plot(shap_values, X_test)\n" \
                    "except Exception as e:\n" \
                    "    print(f'SHAP visualization skipped: {e}')"
        cells.append(self._create_code_cell(shap_code))
        
        cells.append(self._create_markdown_cell("## 5. Model Export\nFinally, we serialize the model to disk so it can be deployed into production systems."))
        
        export_code = "joblib.dump(model, 'best_model.joblib')\n" \
                      "print('Model saved successfully as best_model.joblib')"
        cells.append(self._create_code_cell(export_code))
        
        notebook = {
            "cells": cells,
            "metadata": {
                "kernelspec": {
                    "display_name": "Python 3",
                    "language": "python",
                    "name": "python3"
                },
                "language_info": {
                    "name": "python",
                    "version": "3.8"
                }
            },
            "nbformat": 4,
            "nbformat_minor": 4
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(notebook, f, indent=1)
            
        return filename
