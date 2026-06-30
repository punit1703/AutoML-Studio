import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import os
import uuid

class VisualizationEngine:
    def __init__(self, df: pd.DataFrame, output_dir: str):
        self.df = df
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        sns.set_theme(style="whitegrid")

    def _get_filepath(self, prefix: str) -> str:
        filename = f"{prefix}_{uuid.uuid4().hex[:8]}.png"
        return os.path.join(self.output_dir, filename)

    def _save_and_close(self, filepath: str) -> str:
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight')
        plt.close()
        # Return only relative filename if needed, or relative path to media
        # We'll return just the filename so the API can construct the URL
        return os.path.basename(filepath)

    def plot_histogram(self, column: str, bins: int = 30) -> str:
        if column not in self.df.columns:
            raise ValueError(f"Column {column} not found.")
            
        plt.figure(figsize=(10, 6))
        sns.histplot(data=self.df, x=column, bins=bins, kde=True)
        plt.title(f'Histogram of {column}')
        return self._save_and_close(self._get_filepath('histogram'))

    def plot_boxplot(self, column: str, by_column: str = None) -> str:
        if column not in self.df.columns:
            raise ValueError(f"Column {column} not found.")
            
        plt.figure(figsize=(10, 6))
        if by_column and by_column in self.df.columns:
            sns.boxplot(data=self.df, x=by_column, y=column)
            plt.title(f'Boxplot of {column} by {by_column}')
        else:
            sns.boxplot(data=self.df, y=column)
            plt.title(f'Boxplot of {column}')
        return self._save_and_close(self._get_filepath('boxplot'))

    def plot_scatter(self, x_column: str, y_column: str, hue: str = None) -> str:
        if x_column not in self.df.columns or y_column not in self.df.columns:
            raise ValueError("Columns not found.")
            
        plt.figure(figsize=(10, 6))
        kwargs = {}
        if hue and hue in self.df.columns:
            kwargs['hue'] = hue
            
        sns.scatterplot(data=self.df, x=x_column, y=y_column, **kwargs)
        plt.title(f'Scatter Plot: {x_column} vs {y_column}')
        return self._save_and_close(self._get_filepath('scatter'))

    def plot_pie(self, column: str) -> str:
        if column not in self.df.columns:
            raise ValueError(f"Column {column} not found.")
            
        counts = self.df[column].value_counts()
        plt.figure(figsize=(8, 8))
        plt.pie(counts, labels=counts.index, autopct='%1.1f%%', startangle=90)
        plt.title(f'Pie Chart of {column}')
        return self._save_and_close(self._get_filepath('pie'))

    def plot_bar(self, column: str, y_column: str = None) -> str:
        if column not in self.df.columns:
            raise ValueError(f"Column {column} not found.")
            
        plt.figure(figsize=(12, 6))
        if y_column and y_column in self.df.columns:
            agg_data = self.df.groupby(column)[y_column].mean().reset_index()
            sns.barplot(data=agg_data, x=column, y=y_column)
            plt.title(f'Bar Chart: Mean {y_column} by {column}')
        else:
            counts = self.df[column].value_counts().reset_index()
            counts.columns = [column, 'count']
            sns.barplot(data=counts, x=column, y='count')
            plt.title(f'Bar Chart of {column}')
            
        plt.xticks(rotation=45, ha='right')
        return self._save_and_close(self._get_filepath('bar'))

    def plot_correlation_matrix(self) -> str:
        numeric_df = self.df.select_dtypes(include=[np.number])
        if numeric_df.empty:
            raise ValueError("No numeric columns available for correlation matrix.")
            
        corr = numeric_df.corr()
        plt.figure(figsize=(12, 10))
        sns.heatmap(corr, annot=True, cmap='coolwarm', fmt=".2f", vmin=-1, vmax=1)
        plt.title('Correlation Matrix')
        return self._save_and_close(self._get_filepath('correlation'))

    def plot_target_distribution(self, target_column: str) -> str:
        if target_column not in self.df.columns:
            raise ValueError(f"Target column {target_column} not found.")
            
        plt.figure(figsize=(10, 6))
        if pd.api.types.is_numeric_dtype(self.df[target_column]) and self.df[target_column].nunique() > 20:
            sns.histplot(data=self.df, x=target_column, kde=True)
            plt.title(f'Target Distribution (Regression): {target_column}')
        else:
            counts = self.df[target_column].value_counts().reset_index()
            counts.columns = [target_column, 'count']
            sns.barplot(data=counts, x=target_column, y='count')
            plt.title(f'Target Distribution (Classification): {target_column}')
            
        return self._save_and_close(self._get_filepath('target_dist'))

    def generate_chart(self, chart_type: str, params: dict) -> str:
        if chart_type == 'histogram':
            return self.plot_histogram(params.get('column'), bins=params.get('bins', 30))
        elif chart_type == 'boxplot':
            return self.plot_boxplot(params.get('column'), by_column=params.get('by_column'))
        elif chart_type == 'scatter':
            return self.plot_scatter(params.get('x_column'), params.get('y_column'), hue=params.get('hue'))
        elif chart_type == 'pie':
            return self.plot_pie(params.get('column'))
        elif chart_type == 'bar':
            return self.plot_bar(params.get('column'), y_column=params.get('y_column'))
        elif chart_type == 'correlation':
            return self.plot_correlation_matrix()
        elif chart_type == 'target_distribution':
            return self.plot_target_distribution(params.get('target_column'))
        else:
            raise ValueError(f"Unknown chart type: {chart_type}")
