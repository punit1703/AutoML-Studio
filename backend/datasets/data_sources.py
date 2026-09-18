import pandas as pd
from abc import ABC, abstractmethod

class DataSource(ABC):
    """
    Abstract base class for all dataset sources.
    In the future, this can be extended to support SQL databases, NoSQL, APIs, etc.
    """
    
    @abstractmethod
    def read_dataframe(self) -> pd.DataFrame:
        """
        Reads the data source and returns a pandas DataFrame.
        """
        pass
    
    @abstractmethod
    def get_metadata(self) -> dict:
        """
        Returns basic metadata about the data source without loading the full DataFrame.
        """
        pass

class FileDataSource(DataSource):
    """
    Implementation of DataSource for local files (CSV, Parquet, Excel, JSON).
    """
    def __init__(self, file_path: str, file_name: str):
        self.file_path = file_path
        self.file_name = file_name
        
    def read_dataframe(self, nrows=None) -> pd.DataFrame:
        name_lower = self.file_name.lower()
        if name_lower.endswith('.csv'):
            return pd.read_csv(self.file_path, nrows=nrows)
        elif name_lower.endswith(('.xls', '.xlsx')):
            return pd.read_excel(self.file_path, nrows=nrows)
        elif name_lower.endswith('.json'):
            return pd.read_json(self.file_path, nrows=nrows)
        elif name_lower.endswith('.parquet'):
            return pd.read_parquet(self.file_path) # nrows not natively supported in read_parquet easily
        else:
            raise ValueError(f"Unsupported file format: {self.file_name}")
            
    def get_metadata(self) -> dict:
        df = self.read_dataframe(nrows=5)
        return {
            "source_type": "file",
            "file_name": self.file_name,
            "columns": df.columns.tolist()
        }

# Future implementations can be added here
# class SQLDataSource(DataSource):
#     def __init__(self, connection_string, table_name):
#         ...

# class MongoDataSource(DataSource):
#     def __init__(self, connection_string, collection_name):
#         ...
