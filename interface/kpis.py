import pandas as pd

def calculate_global_metrics(df):

    """
    Calculates KPIs
    """
    if df.empty:
        return {}
    
    # 1. Counts (Absolute Numbers)
    # Success (1.0), Failure (0.0). Ignore NaNs (-).
    success_count = (df['score'] == 1.0).sum()
    failure_count = (df['score'] == 0.0).sum()
    
    # 2. Success Rate
    # Mathematical definition: Success / (Success + Failure)
    total_attempts = success_count + failure_count
    global_rate = df['score'].mean() if total_attempts > 0 else 0.0
    
    # 3. Perfect Days
    daily_scores = df.groupby('date')['score'].mean()
    perfect_days = (daily_scores == 1.0).sum()
    
    # 4. Best & Worst Month
    monthly_performance = df.groupby('month_name')['score'].mean()
    
    if not monthly_performance.empty:
        best_month_name = monthly_performance.idxmax()
        best_month_rate = monthly_performance.max()
        
        worst_month_name = monthly_performance.idxmin()
        worst_month_rate = monthly_performance.min()
    else:
        best_month_name, worst_month_name = "N/A", "N/A"
        best_month_rate, worst_month_rate = 0.0, 0.0
        
    # 5. Secondary metrics
    total_days = df['date'].nunique()
    total_records = len(df)
    
    return {
        "success_rate": global_rate,
        "success_count": success_count,
        "failure_count": failure_count,
        "perfect_days": perfect_days,
        "best_month": best_month_name,
        "best_month_rate": best_month_rate,
        "worst_month": worst_month_name,
        "worst_month_rate": worst_month_rate,
        "total_days": total_days,
        "total_records": total_records
    }