import plotly.express as px
import pandas as pd
import calendar

def get_trend_chart(df):
    """
    Line chart showing the daily success rate with a moving average.
    """
    # Aggregate by date
    daily = df.groupby('date')['score'].mean().reset_index()
    
    # Calculate a 7-day rolling average to smooth the line
    daily['ma_7d'] = daily['score'].rolling(window=7, min_periods=1).mean()
    
    fig = px.line(
        daily, 
        x='date', 
        y='ma_7d',
        title='Consistency Trend (7-Day Moving Average)',
        labels={'ma_7d': 'Success Rate', 'date': 'Date'},
        color_discrete_sequence=['#00CC96'] # Green-ish color
    )
    
    # Minimalist layout
    fig.update_layout(
        yaxis_tickformat='.0%',
        hovermode="x unified"
    )
    return fig

def get_category_bar_chart(df):
    """
    Bar chart comparing performance between categories (Health, Work, etc.)
    """
    # Group by category
    cat_stats = df.groupby('type')['score'].mean().reset_index().sort_values(by='score', ascending=True)
    
    fig = px.bar(
        cat_stats,
        x='score',
        y='type',
        orientation='h', # Horizontal bars are easier to read
        title='Performance by Category',
        labels={'score': 'Success Rate', 'type': 'Category'},
        color='score',
        color_continuous_scale='Blues'
    )
    
    fig.update_layout(xaxis_tickformat='.0%')
    return fig

def get_calendar_scatter(df):
    """
    A scatter plot that mimics a calendar/heatmap view.
    Shows individual dots for every habit completed.
    """
    # Filter only completed habits (Score = 1) for a cleaner "Achievements" view
    # Or show all to see red/green dots. Let's show all active days.
    
    fig = px.scatter(
        df,
        x='date',
        y='habit',
        color='score',
        title='Daily Habit Log',
        color_continuous_scale=['#EF553B', '#00CC96'], # Red to Green
        symbol_sequence=['square']
    )
    
    fig.update_layout(
        yaxis={'title': None},
        xaxis={'title': None}
    )
    return fig

def get_productivity_heatmap(df):
    """
    Creates a Github-style Calendar Heatmap based on 'Net Productivity'.
    
    Logic:
    - Status '1' (Done) = +1 point
    - Status '0' (Failed) = -1 point
    - Status '-' (Rest) = 0 points
    
    The visualization maps Week of Year (X) vs Day of Week (Y).
    """
    # 1. Calculate Daily Net Score
    # We first map the status to the new point system
    df_scored = df.copy()
    
    # Define scoring system
    score_map = {'1': 1, '0': -1, '-': 0}
    # Apply map safely (converting to string first just in case)
    df_scored['net_points'] = df_scored['status'].astype(str).map(score_map).fillna(0)
    
    # Group by Date to get the Daily Sum
    daily_score = df_scored.groupby('date')['net_points'].sum().reset_index()
    
    # 2. Prepare coordinates for Heatmap
    daily_score['week_of_year'] = daily_score['date'].dt.isocalendar().week
    daily_score['day_of_week'] = daily_score['date'].dt.dayofweek # 0=Monday, 6=Sunday
    # Map numbers to names for the Y axis
    days_map = {0:'Mon', 1:'Tue', 2:'Wed', 3:'Thu', 4:'Fri', 5:'Sat', 6:'Sun'}
    daily_score['day_name'] = daily_score['day_of_week'].map(days_map)
    daily_score['date_str'] = daily_score['date'].dt.strftime('%Y-%m-%d')
    
    # 3. Create Heatmap
    # We use a diverging color scale: Red (Negative) -> White (0) -> Green (Positive)
    # Range is roughly -21 to +21 as requested
    max_val = 21
    
    fig = px.density_heatmap(
        daily_score,
        x="week_of_year",
        y="day_name",
        z="net_points",
        color_continuous_scale="RdYlGn", # Red-Yellow-Green
        range_color=[-max_val, max_val],
        title="<b>Productivity Heatmap</b> (Net Daily Score)",
        labels={'week_of_year': 'Week', 'day_name': 'Day', 'net_points': 'Net Score'}
    )
    
    # 4. Refine Layout to look like a calendar
    fig.update_layout(
        xaxis=dict(tickmode='linear', dtick=2), # Show every 2nd week number
        yaxis=dict(categoryorder='array', categoryarray=['Sun', 'Sat', 'Fri', 'Thu', 'Wed', 'Tue', 'Mon']),
        plot_bgcolor='white',
        margin=dict(t=50, l=0, r=0, b=0)
    )
    
    # Make cells square-ish
    fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor='White')
    fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor='White')
    
    return fig

def get_wall_calendar_view(df):
    """
    Creates a traditional 'Wall Calendar' view with separated months.
    Uses Facet Grids to display months side-by-side.
    """
    df_cal = df.copy()
    
    # 1. Calculate Net Score (Same logic as before)
    score_map = {'1': 1, '0': -1, '-': 0}
    df_cal['net_points'] = df_cal['status'].astype(str).map(score_map).fillna(0)
    
    # Aggregate by Day (Summing points of all habits in that day)
    daily_data = df_cal.groupby('date')['net_points'].sum().reset_index()
    
    # 2. Coordinate Engineering (The tricky part)
    # We need to calculate 'Week of Month' to know which row to place the dot
    daily_data['year'] = daily_data['date'].dt.year
    daily_data['month'] = daily_data['date'].dt.month
    daily_data['month_name'] = daily_data['date'].dt.strftime('%B')
    daily_data['day_of_week'] = daily_data['date'].dt.dayofweek # 0=Mon, 6=Sun
    
    # Logic to get "Week Number within the Month" (1st, 2nd, 3rd week...)
    # We essentially adjust the week number relative to the first day of the month
    def get_week_of_month(date_val):
        first_day = date_val.replace(day=1)
        # Adjust so week starts on Monday (ISO standard)
        dom = date_val.day
        adjusted_dom = dom + first_day.weekday()
        return int((adjusted_dom - 1) / 7) + 1

    daily_data['week_of_month'] = daily_data['date'].apply(get_week_of_month)
    
    # 3. Sort Months Chronologically (Crucial for display order)
    # We make 'month_name' a categorical type with fixed order
    month_order = list(calendar.month_name)[1:] # ['January', 'February', ...]
    daily_data['month_name'] = pd.Categorical(
        daily_data['month_name'], 
        categories=month_order, 
        ordered=True
    )
    daily_data = daily_data.sort_values('date')
    
    # 4. Plotting - Using Scatter with Square markers ensures perfect spacing
    fig = px.scatter(
        daily_data,
        x="day_of_week",
        y="week_of_month",
        facet_col="month_name",
        facet_col_wrap=3, # 3 Months per row
        color="net_points",
        color_continuous_scale="RdYlGn", # Red to Green
        range_color=[-21, 21], # Adjust scale based on your max possible points
        symbol_sequence=['square'], # Makes it look like blocks
        hover_data=['date', 'net_points']
    )
    
    # 5. Aesthetic Adjustments
    fig.update_traces(marker=dict(size=20, line=dict(width=1, color='DarkSlateGrey')))
    
    # Invert Y axis so Week 1 is at top
    fig.update_yaxes(autorange="reversed", visible=False, matches=None)
    
    # X Axis formatting (M, T, W, T, F, S, S)
    fig.update_xaxes(
        tickvals=[0, 1, 2, 3, 4, 5, 6],
        ticktext=['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        title=None,
        showgrid=False
    )
    
    fig.update_layout(
        title="<b>Monthly Performance Calendar</b>",
        margin=dict(t=50, l=10, r=10, b=10),
        height=800, # Taller height to fit multiple rows of months
        showlegend=False
    )
    
    # Clean up facet labels (remove "month_name=")
    fig.for_each_annotation(lambda a: a.update(text=a.text.split("=")[-1]))
    
    return fig