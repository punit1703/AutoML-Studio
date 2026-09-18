from .dataset_processor import DatasetProcessor
import polars as pl
import os

class DatasetProfiler:
    def __init__(self, file_path: str):
        self.processor = DatasetProcessor.create(file_path)
        
    def profile(self) -> dict:
        """
        Extract detailed metadata for the LLM Decision Engine.
        Uses Polars for performance, scaling up to out-of-core memory sizes via LazyFrames.
        """
        metadata = self.processor.get_metadata()
        
        # Determine numerical and categorical columns
        numerical_cols = []
        categorical_cols = []
        datetime_cols = []
        
        for col, dtype in metadata["dtypes"].items():
            dtype_lower = dtype.lower()
            if any(t in dtype_lower for t in ['int', 'float', 'double', 'decimal']):
                numerical_cols.append(col)
            elif 'date' in dtype_lower or 'time' in dtype_lower:
                datetime_cols.append(col)
            else:
                categorical_cols.append(col)
                
        # To avoid loading huge data completely, we scan/sample for detailed stats
        data = self.processor.read_all()
        
        if isinstance(data, pl.LazyFrame):
            # For chunked processing, compute aggregated stats
            null_counts = data.null_count().collect().to_dicts()[0]
            
            # For unique counts, we can do it lazily
            unique_counts = {}
            for col in categorical_cols[:20]: # Limit to avoid massive memory usage
                unique_counts[col] = data.select(pl.col(col).n_unique()).collect().item()
        else:
            # In memory
            null_counts = data.null_count().to_dicts()[0]
            unique_counts = {col: data[col].n_unique() for col in categorical_cols}
            
        metadata.update({
            "numerical_columns": numerical_cols,
            "categorical_columns": categorical_cols,
            "datetime_columns": datetime_cols,
            "null_counts": null_counts,
            "unique_counts": unique_counts,
            "file_size_mb": round(os.path.getsize(self.processor.file_path) / (1024 * 1024), 2)
        })
        
        return metadata
