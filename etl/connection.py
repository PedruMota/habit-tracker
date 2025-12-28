import gspread
import pandas as pd
from pathlib import Path

# --- CONFIGURAÇÃO DE CAMINHOS ---
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
CREDENTIALS_FILE = PROJECT_ROOT / 'credentials.json'

# Configuração da Planilha
SPREADSHEET_NAME = "habits-2025" 
# Ordem cronológica é importante aqui
MONTHLY_SHEETS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "ago", "set", "out", "nov", "dez"]

def get_gspread_client():
    if not CREDENTIALS_FILE.exists():
        raise FileNotFoundError(f"Credentials file not found at: {CREDENTIALS_FILE}")
    return gspread.service_account(filename=str(CREDENTIALS_FILE))

def load_raw_data():
    """
    Retorna uma LISTA de DataFrames brutos, um para cada aba.
    Não tenta concatenar nada ainda.
    """
    print(f"--- Connecting to Google Sheets: {SPREADSHEET_NAME} ---")
    
    try:
        client = get_gspread_client()
        sh = client.open(SPREADSHEET_NAME)
        
        raw_datasets = []

        for sheet_name in MONTHLY_SHEETS:
            try:
                worksheet = sh.worksheet(sheet_name)
                data = worksheet.get_all_records()
                
                if data:
                    df = pd.DataFrame(data)
                    # Opcional: Marcar a origem dos dados caso precise debugar
                    # df['_origin_sheet'] = sheet_name 
                    raw_datasets.append(df)
                    print(f"✓ Baixado: {sheet_name} ({len(df)} linhas)")
                
            except gspread.WorksheetNotFound:
                print(f"✕ Aviso: Aba '{sheet_name}' não encontrada.")
            except Exception as e:
                print(f"✕ Erro na aba '{sheet_name}': {e}")

        return raw_datasets

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        return []