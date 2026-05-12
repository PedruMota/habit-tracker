import gspread
import pandas as pd
from pathlib import Path

# --- CONFIGURAÇÃO DE CAMINHOS ---
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
CREDENTIALS_FILE = PROJECT_ROOT / 'credentials.json'

# --- CONFIGURAÇÃO MULTI-ANO ---
# Substituímos o SPREADSHEET_NAME único por um dicionário mapeando os anos
SPREADSHEETS = {
    "2025": "habits-2025",
    "2026": "habits-2026"
}

# Ordem cronológica é importante aqui
MONTHLY_SHEETS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "ago", "set", "out", "nov", "dez"]

def get_gspread_client():
    if not CREDENTIALS_FILE.exists():
        raise FileNotFoundError(f"Credentials file not found at: {CREDENTIALS_FILE}")
    return gspread.service_account(filename=str(CREDENTIALS_FILE))

def load_raw_data():
    """
    Retorna uma LISTA de DataFrames brutos, extraindo de múltiplos anos (planilhas).
    Não tenta concatenar nada ainda.
    """
    print("--- Starting Multi-Year Data Extraction ---")
    
    try:
        client = get_gspread_client()
        raw_datasets = []

        # Faz o loop passando por cada ano/planilha no dicionário
        for year, spreadsheet_name in SPREADSHEETS.items():
            print(f"\n>> Connecting to Google Sheets: {spreadsheet_name} ({year})")
            
            try:
                sh = client.open(spreadsheet_name)
            except gspread.SpreadsheetNotFound:
                print(f"✕ Erro: Planilha '{spreadsheet_name}' não encontrada. Verifique o nome e se o e-mail de serviço tem acesso.")
                continue # Pula para o próximo ano se der erro nesta planilha

            for sheet_name in MONTHLY_SHEETS:
                try:
                    worksheet = sh.worksheet(sheet_name)
                    data = worksheet.get_all_records()
                    
                    if data:
                        df = pd.DataFrame(data)
                        # CRUCIAL: Adicionamos o ano de origem para o processador não misturar tudo
                        df['_year'] = year
                        df['_origin_sheet'] = sheet_name 
                        raw_datasets.append(df)
                        print(f"  ✓ Baixado: {sheet_name} ({len(df)} linhas)")
                
                except gspread.WorksheetNotFound:
                    print(f"  ✕ Aviso: Aba '{sheet_name}' não encontrada em {year}.")
                except Exception as e:
                    print(f"  ✕ Erro na aba '{sheet_name}' ({year}): {e}")

        return raw_datasets

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        return []