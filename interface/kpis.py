import pandas as pd

def calculate_global_metrics(df):
    """
    Calculates the headline numbers for the dashboard.
    
    Args:
        df (pd.DataFrame): The filtered dataframe containing habit data.
        
    Returns:
        dict: A dictionary with 'success_rate', 'total_days', 'best_month', etc.
    """
    if df.empty:
        return {}
    
    # 1. Overall Success Rate
    # Mean of the 'score' column (ignoring NaNs automatically)
    global_rate = df['score'].mean()
    
    # 2. Total tracked days (Unique dates)
    total_days = df['date'].nunique()
    
    # 3. Total Records (Habits tracked)
    total_records = len(df)
    
    # 4. Best Month Logic
    # Group by month and calculate mean score
    monthly_performance = df.groupby('month_name')['score'].mean()
    
    if not monthly_performance.empty:
        best_month_name = monthly_performance.idxmax()
        best_month_rate = monthly_performance.max()
    else:
        best_month_name = "N/A"
        best_month_rate = 0.0
        
    return {
        "success_rate": global_rate,
        "total_days": total_days,
        "total_records": total_records,
        "best_month": best_month_name,
        "best_month_rate": best_month_rate
    }