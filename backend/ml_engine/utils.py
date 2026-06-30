import pandas as pd
import os

def read_dataframe(file_path: str, file_name: str, nrows: int = None) -> pd.DataFrame:
    """
    Reads a dataset file into a pandas DataFrame.
    Supports CSV, Excel, and JSON formats.
    
    Args:
        file_path (str): Absolute path to the file.
        file_name (str): Original filename, used to extract the extension.
        nrows (int, optional): Number of rows to read. Useful for previews.
        
    Returns:
        pd.DataFrame: Parsed DataFrame.
        
    Raises:
        ValueError: If the file format is unsupported or parsing fails.
    """
    ext = os.path.splitext(file_name)[1].lower()
    
    try:
        if ext == '.csv':
            return pd.read_csv(file_path, nrows=nrows)
        elif ext in ['.xls', '.xlsx']:
            return pd.read_excel(file_path, nrows=nrows)
        elif ext == '.json':
            return pd.read_json(file_path, nrows=nrows)
        else:
            raise ValueError(f"Unsupported format: {ext}")
    except Exception as e:
        raise ValueError(f"Error parsing file: {str(e)}")
