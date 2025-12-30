import streamlit as st
import pandas as pd

from etl.connection import load_raw_data
from etl.processor import process_data
from interface.kpis import calculate_global_metrics
from interface.charts import (
    get_trend_chart, 
    get_category_bar_chart, 
    get_productivity_heatmap, 
    get_wall_calendar_view
)

# --- PAGE CONFIG ---
st.set_page_config(page_title="Habit Tracker", page_icon="📈", layout="wide")

# --- DEFINIÇÃO DE ESTILO ---
# Uma única cor primária para toda a identidade visual dos gráficos de análise
PRIMARY_COLOR = '#00CC96' 

# CSS Minimalista
st.markdown("""
<style>
    /* Metric Legends */
    .metric-secondary {
        font-size: 0.85rem;
        opacity: 0.7; /* Opacidade funciona em Light e Dark mode */
        margin-top: -12px;
        margin-bottom: 10px;
        font-weight: 400;
    }
    
    /* Semantic Colors for Text */
    .text-success { color: #28a745; }
    .text-danger { color: #dc3545; }
    
    /* Main Metric Size */
    [data-testid="stMetricValue"] {
        font-size: 32px;
        font-weight: 600;
    }
    
    /* Layout Adjustments */
    .block-container { padding-top: 2rem; }
    
    /* Tabs font adjustments */
    button[data-baseweb="tab"] {
        font-size: 16px;
        font-weight: 500;
    }
</style>
""", unsafe_allow_html=True)

def main():
    st.title("Habit Tracker")
    
    # --- LOAD DATA ---
    @st.cache_data(ttl=3600)
    def get_data_pipeline():
        raw_list = load_raw_data()
        if raw_list:
            return process_data(raw_list)
        return None

    with st.spinner("Loading..."):
        df = get_data_pipeline()

    if df is not None and not df.empty:
        
        # --- SIDEBAR FILTERS ---
        st.sidebar.header("Filter Data")
        
        # Reset Button
        if st.sidebar.button("Reset Filters", type="primary"):
            if 'date_range' in st.session_state: del st.session_state.date_range
            if 'cat_filter' in st.session_state: del st.session_state.cat_filter
            if 'habit_filter' in st.session_state: del st.session_state.habit_filter
            st.rerun()

        # 1. Date
        min_date = df['date'].min().date()
        max_date = df['date'].max().date()
        date_range = st.sidebar.date_input("Date Range", value=(min_date, max_date), min_value=min_date, max_value=max_date, key='date_range')
        
        st.sidebar.markdown("---")
        
        # 2. Category
        all_types = sorted(df['type'].unique())
        selected_types = st.sidebar.multiselect("Categories", all_types, default=all_types, key='cat_filter')
        
        # 3. Habit
        available_habits = sorted(df[df['type'].isin(selected_types)]['habit'].unique())
        selected_habits = st.sidebar.multiselect("Habits", available_habits, default=available_habits, key='habit_filter')
        
        # Apply Filters
        mask_date = (df['date'].dt.date >= date_range[0]) & (df['date'].dt.date <= date_range[1])
        mask_type = df['type'].isin(selected_types)
        mask_habit = df['habit'].isin(selected_habits)
        
        df_filtered = df[mask_date & mask_type & mask_habit].copy()
        
        if df_filtered.empty:
            st.warning("No data visible. Try resetting your filters.")
            return

        # --- METRICS ---
        metrics = calculate_global_metrics(df_filtered)
        k1, k2, k3, k4 = st.columns(4)
        
        k1.metric("Success Rate", f"{metrics['success_rate']:.1%}", help="Completed / Total Attempts")
        k1.markdown(f"<div class='metric-secondary'>Hit: {metrics['success_count']} &nbsp;|&nbsp; Miss: {metrics['failure_count']}</div>", unsafe_allow_html=True)
        
        k2.metric("Best Month", metrics['best_month'], help="Highest SR")
        k2.markdown(f"<div class='metric-secondary text-success'>SR: {metrics['best_month_rate']:.1%}</div>", unsafe_allow_html=True)
        
        k3.metric("Worst Month", metrics['worst_month'], help="Lowest SR")
        k3.markdown(f"<div class='metric-secondary text-danger'>SR: {metrics['worst_month_rate']:.1%}</div>", unsafe_allow_html=True)

        k4.metric("Perfect Days", metrics['perfect_days'], help="100% Score days")
        k4.markdown(f"<div class='metric-secondary'>100% Completion</div>", unsafe_allow_html=True)
        
        st.markdown("---")

        # --- TABS ---
        tab1, tab2, tab3, tab4 = st.tabs(["Overview", "Calendar", "Heatmap", "Data"])
        
        # === TAB 1: OVERVIEW ===
        with tab1:
            st.markdown("##### Consistency Trend")
            st.caption("Moving average (7-days) of your daily success rate.")
            # Passamos a cor primária para manter consistência
            st.plotly_chart(get_trend_chart(df_filtered, color_line=PRIMARY_COLOR), use_container_width=True)
            
            st.markdown("---")
            
            st.markdown("##### Performance by Category")
            st.caption("Success rate comparison.")
            # Passamos a mesma cor primária para as barras
            fig_cat = get_category_bar_chart(df_filtered, color_bar=PRIMARY_COLOR)
            fig_cat.update_layout(height=400) 
            st.plotly_chart(fig_cat, use_container_width=True)

        # === TAB 2: WALL CALENDAR ===
        with tab2:
            st.markdown("##### Monthly Calendar")
            st.caption("Daily productivity blocks separated by month.")
            st.plotly_chart(get_wall_calendar_view(df_filtered), use_container_width=True)

        # === TAB 3: HEATMAP ===
        with tab3:
            st.markdown("##### Annual Connectivity")
            st.caption("Darker green indicates higher productivity score.")
            fig_heat = get_productivity_heatmap(df_filtered)
            fig_heat.update_layout(height=500)
            st.plotly_chart(fig_heat, use_container_width=True)

        # === TAB 4: DATA ===
        with tab4:
            st.dataframe(df_filtered.sort_values('date', ascending=False), use_container_width=True, height=600)

    else:
        st.error("Connection Error.")

if __name__ == "__main__":
    main()