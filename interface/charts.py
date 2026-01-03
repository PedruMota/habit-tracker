import plotly.express as px
import pandas as pd
import calendar

# --- PALETA PADRÃO ---
DEFAULT_COLOR = '#00CC96' 

def get_trend_chart(df, color_line=DEFAULT_COLOR):
    """
    Line chart showing the daily success rate with Global Average Line.
    Standard Plotly Hover behavior.
    """
    daily = df.groupby('date')['score'].mean().reset_index()
    daily['ma_7d'] = daily['score'].rolling(window=7, min_periods=1).mean()
    
    fig = px.line(
        daily, 
        x='date', 
        y='ma_7d',
        labels={'ma_7d': 'Success Rate', 'date': 'Date'},
        color_discrete_sequence=[color_line]
    )
    
    # Linha de Média Global
    avg_score = df['score'].mean()
    fig.add_hline(
        y=avg_score, 
        line_dash="dot", 
        line_color="gray", 
        annotation_text=f"Avg: {avg_score:.1%}", 
        annotation_position="top right"
    )
    
    fig.update_layout(
        yaxis_tickformat='.0%',
        hovermode="x unified",
        margin=dict(t=10, l=0, r=0, b=0),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    return fig

def get_multiline_trend_chart(df, dimension='type'):
    """
    Multi-line trend chart comparing Categories.
    Standard Plotly Hover behavior.
    """
    daily = df.groupby(['date', dimension])['score'].mean().reset_index()
    daily['ma_7d'] = daily.groupby(dimension)['score'].transform(
        lambda x: x.rolling(window=7, min_periods=1).mean()
    )
    
    fig = px.line(
        daily, 
        x='date', 
        y='ma_7d',
        color=dimension,
        labels={'ma_7d': 'Success Rate', 'date': 'Date', dimension: ''},
        color_discrete_sequence=px.colors.qualitative.Pastel 
    )
    
    fig.update_layout(
        yaxis_tickformat='.0%',
        hovermode="x unified",
        margin=dict(t=10, l=0, r=0, b=50),
        legend=dict(orientation="h", yanchor="top", y=-0.2, xanchor="center", x=0.5),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    return fig

def get_category_bar_chart(df, color_bar=DEFAULT_COLOR):
    """
    Bar chart comparing performance with GLOBAL AVERAGE LINE.
    """
    cat_stats = df.groupby('type')['score'].agg(['mean', 'count']).reset_index()
    cat_stats = cat_stats.sort_values(by='mean', ascending=True)
    cat_stats['label'] = cat_stats.apply(lambda x: f"{x['mean']:.1%} (N={int(x['count'])})", axis=1)
    
    fig = px.bar(
        cat_stats,
        x='mean',
        y='type',
        orientation='h',
        labels={'mean': 'Success Rate', 'type': ''},
        text='label'
    )
    
    fig.update_traces(marker_color=color_bar, textposition='auto')
    
    # --- NOVO: Linha de Média Global ---
    avg_score = df['score'].mean()
    fig.add_vline(
        x=avg_score, 
        line_dash="dot", 
        line_color="gray", 
        annotation_text=f"Avg: {avg_score:.1%}", 
        annotation_position="bottom right"
    )
    
    fig.update_layout(
        xaxis_tickformat='.0%',
        margin=dict(t=0, l=0, r=0, b=0),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    return fig

def get_productivity_heatmap(df, score_map, color_range, color_scale='RdYlGn'):
    """
    Heatmap Anual (Estilo Density/GitHub).
    NOTA: O parâmetro 'color_range' é recebido para compatibilidade, 
    mas NÃO É USADO (range_color removido) para deixar a escala livre/automática.
    """
    # 1. Aplicar mapa de pontuação
    df_scored = df.copy()
    df_scored['net_points'] = df_scored['status'].astype(str).map(score_map).fillna(0)
    
    # 2. Agrupar por Dia
    daily_score = df_scored.groupby('date')['net_points'].sum().reset_index()
    
    # 3. Preparar eixos
    daily_score['week_of_year'] = daily_score['date'].dt.isocalendar().week
    daily_score['day_of_week'] = daily_score['date'].dt.dayofweek
    days_map = {0:'Mon', 1:'Tue', 2:'Wed', 3:'Thu', 4:'Fri', 5:'Sat', 6:'Sun'}
    daily_score['day_name'] = daily_score['day_of_week'].map(days_map)
    
    # 4. Plotar Heatmap (DENSITY)
    # A escala se ajustará sozinha aos dados (Min/Max automáticos)
    fig = px.density_heatmap(
        daily_score,
        x="week_of_year",
        y="day_name",
        z="net_points",
        color_continuous_scale=color_scale,
        # range_color=color_range, <--- REMOVIDO PARA ESCALA LIVRE
        labels={'week_of_year': 'Week No.', 'day_name': '', 'net_points': 'Score'}
    )
    
    fig.update_layout(
        xaxis=dict(tickmode='linear', dtick=4, showgrid=False),
        yaxis=dict(categoryorder='array', categoryarray=['Sun', 'Sat', 'Fri', 'Thu', 'Wed', 'Tue', 'Mon']),
        margin=dict(t=10, l=0, r=0, b=20),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    
    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='rgba(128,128,128,0.2)')
    fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='rgba(128,128,128,0.2)')
    
    return fig

def get_wall_calendar_view(df, score_map, color_range, color_scale='RdYlGn'):
    """
    Calendar dinâmico: Aceita mapa de pontos e limites de cor.
    """
    df_cal = df.copy()
    # 1. Aplicar o mapa de pontuação recebido
    df_cal['net_points'] = df_cal['status'].astype(str).map(score_map).fillna(0)
    
    daily_data = df_cal.groupby('date')['net_points'].sum().reset_index()
    daily_data['month_name'] = daily_data['date'].dt.strftime('%B')
    daily_data['day_of_week'] = daily_data['date'].dt.dayofweek
    daily_data['day_num'] = daily_data['date'].dt.day.astype(str)
    
    def get_week_of_month(date_val):
        first_day = date_val.replace(day=1)
        dom = date_val.day
        adjusted_dom = dom + first_day.weekday()
        return int((adjusted_dom - 1) / 7) + 1

    daily_data['week_of_month'] = daily_data['date'].apply(get_week_of_month)
    month_order = list(calendar.month_name)[1:]
    daily_data['month_name'] = pd.Categorical(daily_data['month_name'], categories=month_order, ordered=True)
    daily_data = daily_data.sort_values('date')
    
    fig = px.scatter(
        daily_data,
        x="day_of_week",
        y="week_of_month",
        facet_col="month_name",
        facet_col_wrap=3,
        color="net_points",
        color_continuous_scale=color_scale,
        range_color=color_range, # Limites dinâmicos
        symbol_sequence=['square'],
        hover_data=['date', 'net_points'],
        text='day_num'
    )
    
    fig.update_traces(
        marker=dict(size=24, line=dict(width=0.5, color='rgba(128,128,128,0.5)')),
        textfont=dict(size=10, color='black'),
        selector=dict(mode='markers+text')
    )
    
    fig.update_yaxes(range=[6.5, 0.5], visible=False, matches=None)
    fig.update_xaxes(
        tickvals=[0, 1, 2, 3, 4, 5, 6],
        ticktext=['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        title=None,
        showgrid=False
    )
    
    fig.update_layout(
        margin=dict(t=20, l=0, r=0, b=0),
        height=800,
        showlegend=False,
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    
    fig.for_each_annotation(lambda a: a.update(text=a.text.split("=")[-1]))
    
    return fig

def get_day_of_week_chart(df, color_bar=DEFAULT_COLOR):
    """
    Bar chart showing average performance by Day of the Week.
    Useful to find weekly patterns (e.g., "Monday Blue" or "Weak Weekends").
    """
    df_dow = df.copy()
    df_dow['day_name'] = df_dow['date'].dt.day_name()
    df_dow['day_num'] = df_dow['date'].dt.dayofweek
    
    # Agrupa e calcula média
    dow_stats = df_dow.groupby(['day_num', 'day_name'])['score'].mean().reset_index()
    
    # Ordena de Segunda (0) a Domingo (6)
    dow_stats = dow_stats.sort_values('day_num')
    
    fig = px.bar(
        dow_stats,
        x='day_name',
        y='score',
        title='', # Controlado pelo Streamlit
        labels={'score': 'Success Rate', 'day_name': ''},
        text_auto='.1%' # Mostra valor na barra
    )
    
    fig.update_traces(marker_color=color_bar)
    
    # Adiciona linha de média geral para comparação
    avg_score = df['score'].mean()
    fig.add_hline(y=avg_score, line_dash="dot", line_color="gray", annotation_text="Avg", annotation_position="top right")
    
    fig.update_layout(
        yaxis_tickformat='.0%',
        margin=dict(t=0, l=0, r=0, b=0),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        height=350
    )
    
    return fig

def get_correlation_heatmap(df):
    """
    Correlation Matrix between Habits.
    Answers: "When I do Habit A, do I also do Habit B?"
    """
    # 1. Pivotar: Linhas=Datas, Colunas=Hábitos, Valores=Score
    # Precisamos mapear os status para números primeiro
    # Usaremos uma lógica simples: 1 (Feito), 0 (Falha). Descanso vira NaN (não entra na correlação)
    
    df_pivot = df.pivot(index='date', columns='habit', values='status')
    
    # Map: '1'->1, '0'->0, '-'->NaN
    # A correlação ignora NaNs, o que é perfeito (dias de descanso não atrapalham a análise)
    df_pivot = df_pivot.replace({'1': 1, '0': 0, '-': None})
    df_pivot = df_pivot.apply(pd.to_numeric)
    
    # Se houver menos de 2 hábitos filtrados, não dá para fazer correlação
    if df_pivot.shape[1] < 2:
        return None
        
    # 2. Calcular Correlação (Pearson)
    corr_matrix = df_pivot.corr()
    
    # 3. Plotar Heatmap
    # Usamos escala divergente (Vermelho = Correlação Inversa, Verde = Direta)
    fig = px.imshow(
        corr_matrix,
        text_auto='.2f', # Mostra o coeficiente
        aspect="auto",
        color_continuous_scale="RdBu", # Vermelho-Branco-Azul (Padrão científico para corr)
        # Ou "RdYlGn" se preferir manter o tema, mas RdBu é mais comum para correlação
        zmin=-1, zmax=1,
        labels=dict(x="Habit", y="Habit", color="Correlation")
    )
    
    fig.update_layout(
        margin=dict(t=0, l=0, r=0, b=0),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)',
        height=600 # Quadrado grande
    )
    
    return fig