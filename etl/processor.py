import pandas as pd
import numpy as np

def _process_single_month(df_raw):
    """
    Função auxiliar que limpa UM ÚNICO mês.
    Como processamos mês a mês, não temos conflito de colunas de datas.
    """
    if df_raw.empty:
        return pd.DataFrame()

    # 1. Melt (Verticalizar)
    # Identificamos as colunas fixas. O resto é data.
    id_vars = ['type', 'habit']
    value_vars = [c for c in df_raw.columns if c not in id_vars]
    
    df_melted = df_raw.melt(id_vars=id_vars, value_vars=value_vars, var_name='date_str', value_name='status')
    
    # 2. Limpeza Básica
    df_melted['status'] = df_melted['status'].astype(str).str.strip()
    
    # Remover dias vazios (onde não há registro)
    # Isso evita processar colunas vazias que o Google Sheets as vezes traz
    df_melted = df_melted[df_melted['status'] != '']
    
    return df_melted

def process_data(raw_data_list):
    """
    Recebe uma LISTA de dataframes brutos, processa cada um individualmente
    e só no final concatena.
    """
    if not raw_data_list:
        return pd.DataFrame()

    processed_frames = []

    # Passo 1: Processar cada mês isoladamente
    for raw_df in raw_data_list:
        clean_month = _process_single_month(raw_df)
        processed_frames.append(clean_month)
    
    # Passo 2: Juntar tudo (Agora é seguro, pois todos têm as mesmas 4 colunas)
    if not processed_frames:
        return pd.DataFrame()
        
    full_df = pd.concat(processed_frames, ignore_index=True)

    # Passo 3: Conversão de Tipos e Feature Engineering (No DF Unificado)
    
    # Converter Data (Dayfirst=True para formato BR)
    full_df['date'] = pd.to_datetime(full_df['date_str'], dayfirst=True, errors='coerce')
    
    # Remover datas inválidas
    full_df = full_df.dropna(subset=['date'])
    
    # Calcular Score
    conditions = [
        full_df['status'] == '1',
        full_df['status'] == '0'
    ]
    choices = [1.0, 0.0]
    
    full_df['score'] = np.select(conditions, choices, default=np.nan)
    
    # Criar colunas extras
    full_df['month_name'] = full_df['date'].dt.strftime('%B')
    full_df['day_of_week'] = full_df['date'].dt.day_name()
    
    # Ordenar
    full_df = full_df.sort_values(by=['date', 'type', 'habit'])
    
    # Selecionar apenas colunas úteis
    final_cols = ['date', 'type', 'habit', 'status', 'score', 'month_name', 'day_of_week']
    
    return full_df[final_cols]