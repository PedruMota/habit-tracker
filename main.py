import streamlit as st
import pandas as pd

# Import modules from our ETL and Interface packages
from etl.connection import load_raw_data
from etl.processor import process_data
from interface.kpis import calculate_global_metrics
# IMPORTANT: Ensure all chart functions are imported here
from interface.charts import (
    get_trend_chart, 
    get_category_bar_chart, 
    get_productivity_heatmap, 
    get_wall_calendar_view
)

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="Habit Tracker 2025",
    page_icon="📈",
    layout="wide"
)

# --- CSS HACK (Optional: Makes metrics look bigger) ---
st.markdown("""
<style>
    [data-testid="stMetricValue"] {
        font-size: 24px;
    }
</style>
""", unsafe_allow_html=True)

def main():
    st.title("📊 Habit Performance System")
    
    # --- 1. LOAD DATA ---
    @st.cache_data(ttl=3600)
    def get_data_pipeline():
        raw_list = load_raw_data()
        if raw_list:
            return process_data(raw_list)
        return None

    with st.spinner("Syncing data with Google Cloud..."):
        df = get_data_pipeline()

    if df is not None and not df.empty:
        
        # --- 2. SIDEBAR FILTERS (Global) ---
        st.sidebar.header("Global Filters")
        
        # Date Filter
        min_date = df['date'].min().date()
        max_date = df['date'].max().date()
        date_range = st.sidebar.date_input(
            "Period", 
            value=(min_date, max_date), 
            min_value=min_date, 
            max_value=max_date
        )
        
        # Apply Date Filter
        mask_date = (df['date'].dt.date >= date_range[0]) & (df['date'].dt.date <= date_range[1])
        df = df[mask_date].copy()
        
        # Calculate Metrics based on filtered date
        metrics = calculate_global_metrics(df)

        # --- 3. TOP METRICS ROW ---
        k1, k2, k3, k4 = st.columns(4)
        k1.metric("Success Rate", f"{metrics['success_rate']:.1%}")
        k2.metric("Active Days", metrics['total_days'])
        k3.metric("Best Month", f"{metrics['best_month']}")
        k4.metric("Total Records", metrics['total_records'])
        
        st.divider()

        # --- 4. TABS STRATEGY ---
        # We now have 4 tabs. I renamed 'tab_calendar' to 'tab_heatmap' to avoid confusion.
        tab_overview, tab_heatmap, tab_wall, tab_details = st.tabs([
            "📈 Overview", 
            "🔥 Git Heatmap", 
            "📅 Wall Calendar", 
            "🔍 Raw Data"
        ])
        
        # === TAB 1: OVERVIEW ===
        with tab_overview:
            st.markdown("### General Performance Trends")
            
            # Category Filter specific to this view
            all_cats = sorted(df['type'].unique())
            sel_cats = st.multiselect("Filter Categories", all_cats, default=all_cats, key="cat_filter_overview")
            
            # Filter DataFrame
            df_overview = df[df['type'].isin(sel_cats)]
            
            row1_col1, row1_col2 = st.columns([2, 1])
            with row1_col1:
                st.plotly_chart(get_trend_chart(df_overview), use_container_width=True)
            with row1_col2:
                st.plotly_chart(get_category_bar_chart(df_overview), use_container_width=True)

        # === TAB 2: GIT HEATMAP (Previously tab_calendar) ===
        with tab_heatmap:
            st.markdown("### Daily Productivity Balance")
            st.caption("Green = Net Positive Day. Red = Net Negative Day.")
            
            st.plotly_chart(get_productivity_heatmap(df), use_container_width=True)
            
            st.info("""
            **How to read:** Each cell is a day. The color represents your **Net Score**:
            (Habits Completed) - (Habits Missed).
            Dark Green days are highly productive. Red days are when missed habits outweighed completed ones.
            """)

        # === TAB 3: WALL CALENDAR (New) ===
        with tab_wall:
            st.markdown("### Traditional Monthly View")
            st.caption("Visualizing each month individually. Squares represent daily net productivity.")
            
            st.plotly_chart(get_wall_calendar_view(df), use_container_width=True)

        # === TAB 4: RAW DATA ===
        with tab_details:
            st.markdown("### Data Inspector")
            st.dataframe(df.sort_values('date', ascending=False), use_container_width=True)

    else:
        st.error("Pipeline failed. Check terminal for error details.")

if __name__ == "__main__":
    main()