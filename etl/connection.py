import gspread
import pandas as pd
import os
from pathlib import Path

# Constants for configuration
CREDENTIALS_FILE = 'credentials.json'
SPREADSHEET_NAME = "habit_tracker"  # Google Sheet name
# List of sheets to iterate over
MONTHLY_SHEETS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "ago", "set", "out", "nov", "dez"]

def get_gspread_client():
    """
    Authenticates with the Google Sheets API using the service account.
    
    Returns:
        gspread.Client: The authenticated client instance.
    
    Raises:
        FileNotFoundError: If the credentials file is missing.
    """
    creds_path = Path(CREDENTIALS_FILE)
    
    if not creds_path.exists():
        raise FileNotFoundError(f"Credentials file not found at: {creds_path.absolute()}")

    # Authenticate using the service account file
    gc = gspread.service_account(filename=str(creds_path))
    return gc

def load_raw_data():
    """
    Fetches and consolidates data from multiple worksheets in the Google Sheet.

    Returns:
        pd.DataFrame: A single DataFrame containing data from all months, 
                      or None if an error occurs.
    """
    print(f"--- Connecting to Google Sheets: {SPREADSHEET_NAME} ---")
    
    try:
        client = get_gspread_client()
        sh = client.open(SPREADSHEET_NAME)
        
        all_data_frames = []

        for sheet_name in MONTHLY_SHEETS:
            try:
                worksheet = sh.worksheet(sheet_name)
                # get_all_records returns a list of dictionaries
                data = worksheet.get_all_records()
                
                if data:
                    df = pd.DataFrame(data)
                    all_data_frames.append(df)
                    print(f"✓ Successfully loaded: {sheet_name}")
                else:
                    print(f"⚠ Warning: Worksheet '{sheet_name}' is empty.")
                    
            except gspread.WorksheetNotFound:
                print(f"✕ Error: Worksheet '{sheet_name}' not found.")

        if all_data_frames:
            # Concatenate all monthly dataframes into one
            full_df = pd.concat(all_data_frames, ignore_index=True)
            return full_df
        else:
            print("No data could be loaded.")
            return None

    except Exception as e:
        print(f"CRITICAL ERROR during data extraction: {e}")
        return None

# Allow running this script directly for testing purposes
if __name__ == "__main__":
    df = load_raw_data()
    if df is not None:
        print("\nData Sample (Head):")
        print(df.head())