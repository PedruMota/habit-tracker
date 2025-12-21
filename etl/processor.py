import pandas as pd
import numpy as np

def process_data(df):
    """
    Cleans and transforms the raw DataFrame from Google Sheets into a Tidy format.
    
    Transformation Steps:
    1. Melt: Unpivot date columns into rows.
    2. Cast Types: Ensure dates are datetime objects.
    3. Score Calculation: Map status symbols to numeric scores.
    4. Feature Engineering: Add auxiliary time-based columns.

    Args:
        df (pd.DataFrame): The raw dataframe with dates as columns.

    Returns:
        pd.DataFrame: A processed, long-format dataframe.
    """
    if df is None or df.empty:
        return pd.DataFrame()

    # 1. Identify ID variables and Value variables
    # 'type' and 'habit' are identifiers. All other columns are treated as dates.
    id_vars = ['type', 'habit']
    value_vars = [c for c in df.columns if c not in id_vars]
    
    # 2. Melt (Unpivot)
    # Transforms wide format [Habit | Jan-01 | Jan-02] -> Long format [Habit | Date | Status]
    df_melted = df.melt(id_vars=id_vars, value_vars=value_vars, var_name='date', value_name='status')
    
    # 3. Date Parsing
    # 'coerce' turns invalid strings (like empty headers) into NaT (Not a Time)
    df_melted['date'] = pd.to_datetime(df_melted['date'], errors='coerce')
    
    # Remove rows with invalid dates (artifacts from empty Excel columns)
    df_melted = df_melted.dropna(subset=['date'])
    
    # 4. Status Cleaning & Scoring
    # Remove accidental whitespace
    df_melted['status'] = df_melted['status'].astype(str).str.strip()
    
    # Logic for Scoring:
    # '1' -> 1.0 (Success)
    # '0' -> 0.0 (Failure)
    # '-' -> NaN (Rest day/Not applicable - excluded from averages)
    conditions = [
        df_melted['status'] == '1',
        df_melted['status'] == '0'
    ]
    choices = [1.0, 0.0]
    
    # np.select is more performant than .apply() for vector operations
    df_melted['score'] = np.select(conditions, choices, default=np.nan)
    
    # 5. Feature Engineering (for Dashboard Filters)
    df_melted['month_name'] = df_melted['date'].dt.strftime('%B')  # e.g., "January"
    df_melted['day_of_week'] = df_melted['date'].dt.day_name()     # e.g., "Monday"
    df_melted['is_active_day'] = df_melted['score'].notna()        # Boolean flag
    
    # Final Sorting
    df_melted = df_melted.sort_values(by=['date', 'type', 'habit'])
    
    return df_melted