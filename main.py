import pandas as pd
from etl.connection import load_raw_data
from etl.processor import process_data

def main():
    print("--- STARTING ETL PIPELINE ---")
    
    # 1. Extraction
    print("Step 1: Fetching data from Google Sheets...")
    raw_data = load_raw_data()
    
    if raw_data is not None:
        print(f"✓ Raw data fetched! Shape: {raw_data.shape}")
        
        # 2. Transformation
        print("Step 2: Processing data...")
        clean_data = process_data(raw_data)
        
        print("\n--- DATA QUALITY CHECK ---")
        print(clean_data.head())
        print(f"\nFinal Shape: {clean_data.shape}")
        print("\nColumns:", clean_data.columns.tolist())
        
        # Simple Logic Check
        if 'score' in clean_data.columns:
            avg_score = clean_data['score'].mean()
            print(f"\nGlobal Success Rate (Test): {avg_score:.2%}")
        
    else:
        print("FAILED: Could not fetch data.")

if __name__ == "__main__":
    main()