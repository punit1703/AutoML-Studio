import polars as pl
import pandas as pd
import os
from abc import ABC, abstractmethod

class DatasetProcessor(ABC):
    def __init__(self, file_path: str):
        self.file_path = file_path
        
    @abstractmethod
    def get_metadata(self) -> dict:
        pass

    @abstractmethod
    def read_all(self):
        pass
        
    @staticmethod
    def create(file_path: str):
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        
        # If > 100MB, use ChunkProcessor (Polars streaming/lazy where possible)
        # For now, we use Polars for everything as it's faster anyway
        if file_size_mb > 100:
            return ChunkProcessor(file_path)
        else:
            return InMemoryProcessor(file_path)


class InMemoryProcessor(DatasetProcessor):
    def read_all(self):
        if self.file_path.endswith('.csv'):
            return pl.read_csv(self.file_path, ignore_errors=True)
        elif self.file_path.endswith('.parquet'):
            return pl.read_parquet(self.file_path)
        else:
            return pl.from_pandas(pd.read_excel(self.file_path))
            
    def get_metadata(self) -> dict:
        df = self.read_all()
        return {
            "row_count": df.height,
            "column_count": df.width,
            "columns": df.columns,
            "dtypes": {col: str(dtype) for col, dtype in zip(df.columns, df.dtypes)}
        }


class ChunkProcessor(DatasetProcessor):
    def read_all(self):
        # Lazy frame for processing
        if self.file_path.endswith('.csv'):
            return pl.scan_csv(self.file_path, ignore_errors=True)
        elif self.file_path.endswith('.parquet'):
            return pl.scan_parquet(self.file_path)
        else:
            raise ValueError("Chunk processing not supported for this file type")

    def get_metadata(self) -> dict:
        # We can use lazy scanning to get some metadata efficiently
        lf = self.read_all()
        schema = lf.collect_schema()
        
        # We need to collect row count which forces a scan, but it's optimized in polars
        row_count = lf.select(pl.len()).collect().item()
        
        return {
            "row_count": row_count,
            "column_count": len(schema),
            "columns": list(schema.names()),
            "dtypes": {col: str(dtype) for col, dtype in schema.items()}
        }
