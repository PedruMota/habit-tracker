import gspread
import pandas as pd

def load_data_from_sheets():
    # 1. Autenticação
    # O gspread procura o arquivo de credenciais. 
    # Em projetos reais (Streamlit Cloud), usaremos 'Secrets', 
    # mas localmente usamos o arquivo JSON.
    gc = gspread.service_account(filename='credentials.json')

    # 2. Abrir a planilha
    # Substitua pelo nome EXATO da sua planilha no Google ou a URL dela
    sh = gc.open("habits 2025") # Exemplo: nome do arquivo lá no Google Drive

    # 3. Consolidar todas as abas (Jan, Fev, Mar...)
    all_data = []
    
    # Lista das abas que queremos ler (ajuste conforme seus nomes reais)
    worksheets_names = ["jan", "feb", "mar", "apr", "may", "jun", "jul"]

    for sheet_name in worksheets_names:
        try:
            # Seleciona a aba
            worksheet = sh.worksheet(sheet_name)
            
            # Pega todos os dados como lista de dicionários
            data = worksheet.get_all_records()
            
            # Transforma em DataFrame
            df = pd.DataFrame(data)
            
            # Opcional: Adicionar uma coluna para saber de qual mês veio (se necessário)
            # df['month_sheet'] = sheet_name 
            
            all_data.append(df)
            print(f"Aba '{sheet_name}' carregada com sucesso!")
            
        except gspread.WorksheetNotFound:
            print(f"Aviso: Aba '{sheet_name}' não encontrada.")

    # 4. Juntar tudo em um único DataFrame
    if all_data:
        full_df = pd.concat(all_data, ignore_index=True)
        return full_df
    else:
        return None

# Testando a função
if __name__ == "__main__":
    df_final = load_data_from_sheets()
    if df_final is not None:
        print("\nDados carregados! Primeiras 5 linhas:")
        print(df_final.head())
        # Aqui você pode chamar sua função de limpeza (o melt/tidy data)
    else:
        print("Erro ao carregar dados.")