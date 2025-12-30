import plotly.express as px
import pandas as pd
import calendar

# --- PALETA PADRÃO ---
DEFAULT_COLOR = '#00CC96' 

def get_trend_chart(df, color_line=DEFAULT_COLOR):
    """
    Line chart showing the daily success rate.
    Uses transparent background to adapt to any Streamlit theme.
    """
    daily = df.groupby('date')['score'].mean().reset_index()
    # Média móvel de 7 dias para suavizar a linha
    daily['ma_7d'] = daily['score'].rolling(window=7, min_periods=1).mean()
    
    fig = px.line(
        daily, 
        x='date', 
        y='ma_7d',
        labels={'ma_7d': 'Success Rate', 'date': 'Date'},
        color_discrete_sequence=[color_line] # Usa a cor única
    )
    
    fig.update_layout(
        yaxis_tickformat='.0%',
        hovermode="x unified",
        margin=dict(t=10, l=0, r=0, b=0),
        # Fundo Transparente
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    return fig

def get_category_bar_chart(df, color_bar=DEFAULT_COLOR):
    """
    Bar chart comparing performance.
    All bars have the SAME color to match the line chart consistency.
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
    
    # Força a cor única para todas as barras
    fig.update_traces(marker_color=color_bar, textposition='auto')
    
    fig.update_layout(
        xaxis_tickformat='.0%',
        margin=dict(t=0, l=0, r=0, b=0),
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    return fig

def get_productivity_heatmap(df):
    """
    Heatmap: Uses Red-Yellow-Green scale (Classic Semantic Colors).
    """
    score_map = {'1': 1, '0': -1, '-': 0}
    df_scored = df.copy()
    df_scored['net_points'] = df_scored['status'].astype(str).map(score_map).fillna(0)
    
    daily_score = df_scored.groupby('date')['net_points'].sum().reset_index()
    daily_score['week_of_year'] = daily_score['date'].dt.isocalendar().week
    daily_score['day_of_week'] = daily_score['date'].dt.dayofweek
    days_map = {0:'Mon', 1:'Tue', 2:'Wed', 3:'Thu', 4:'Fri', 5:'Sat', 6:'Sun'}
    daily_score['day_name'] = daily_score['day_of_week'].map(days_map)
    
    max_val = 21 
    
    fig = px.density_heatmap(
        daily_score,
        x="week_of_year",
        y="day_name",
        z="net_points",
        color_continuous_scale="RdYlGn", # Mantemos semântico (Verde=Bom, Vermelho=Ruim)
        range_color=[-max_val, max_val],
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

def get_wall_calendar_view(df):
    """
    Wall Calendar view.
    """
    df_cal = df.copy()
    score_map = {'1': 1, '0': -1, '-': 0}
    df_cal['net_points'] = df_cal['status'].astype(str).map(score_map).fillna(0)
    
    daily_data = df_cal.groupby('date')['net_points'].sum().reset_index()
    daily_data['month_name'] = daily_data['date'].dt.strftime('%B')
    daily_data['day_of_week'] = daily_data['date'].dt.dayofweek
    
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
        color_continuous_scale="RdYlGn",
        range_color=[-21, 21],
        symbol_sequence=['square'],
        hover_data=['date', 'net_points']
    )
    
    fig.update_traces(marker=dict(size=18, line=dict(width=0.5, color='rgba(128,128,128,0.5)')))
    fig.update_yaxes(autorange="reversed", visible=False, matches=None)
    fig.update_xaxes(
        tickvals=[0, 1, 2, 3, 4, 5, 6],
        ticktext=['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        title=None,
        showgrid=False
    )
    
    fig.update_layout(
        margin=dict(t=20, l=0, r=0, b=0),
        height=700,
        showlegend=False,
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    
    fig.for_each_annotation(lambda a: a.update(text=a.text.split("=")[-1]))
    
    return fig