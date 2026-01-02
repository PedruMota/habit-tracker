import streamlit as st
import pandas as pd

from etl.connection import load_raw_data
from etl.processor import process_data
from interface.kpis import calculate_global_metrics
from interface.charts import (
    get_trend_chart, 
    get_category_bar_chart, 
    get_productivity_heatmap, 
    get_wall_calendar_view,
    get_multiline_trend_chart
)

# --- PAGE CONFIG ---
st.set_page_config(page_title="Habit Tracker", page_icon="📈", layout="wide")
PRIMARY_COLOR = '#00CC96' 

# --- CSS Minimalista ---
st.markdown("""
<style>
    .metric-secondary {
        font-size: 0.85rem;
        opacity: 0.7;
        margin-top: -12px;
        margin-bottom: 10px;
        font-weight: 400;
    }
    .text-success { color: #28a745; }
    .text-danger { color: #dc3545; }
    [data-testid="stMetricValue"] { font-size: 32px; font-weight: 600; }
    .block-container { padding-top: 2rem; }
    
    button[data-baseweb="tab"] { font-size: 16px; font-weight: 500; }
</style>
""", unsafe_allow_html=True)

# --- FUNÇÃO DE CONTROLE DE PONTUAÇÃO ---
def render_scoring_widget(key_suffix, total_habits_ref):
    """
    Renderiza botões de seleção e explica a matemática do score.
    """
    presets = {
        "Simétrico":   {'w_hit': 1.0, 'w_miss': -1.0, 'desc': 'Equilíbrio Total (+1 / -1)'},
        "Progressivo": {'w_hit': 1.0, 'w_miss': -0.5, 'desc': 'Foco no Acerto (+1 / -0.5)'},
    }
    
    col_opt, col_custom = st.columns([2, 3])
    with col_opt:
        mode = st.radio(
            "Regra de Pontuação:",
            list(presets.keys()) + ["Custom"],
            horizontal=True,
            key=f"mode_{key_suffix}"
        )

    if mode == "Custom":
        with col_custom:
            c1, c2 = st.columns(2)
            w_done = c1.number_input("Peso Hit (+)", value=1.0, step=0.1, key=f"wd_{key_suffix}")
            w_miss = c2.number_input("Peso Miss (-)", value=-0.5, step=0.1, key=f"wm_{key_suffix}")
            w_rest = 0.0
            description = "Pesos definidos manualmente."
    else:
        w_done = presets[mode]['w_hit']
        w_miss = presets[mode]['w_miss']
        w_rest = 0.0
        description = presets[mode]['desc']

    st.caption(f"""
    ⚙️ **{description}** | Fórmula: (Hits × {w_done}) + (Misses × {w_miss})
    """)

    score_map = {'1': w_done, '0': w_miss, '-': w_rest}

    # CÁLCULO DINÂMICO USANDO O TOTAL DO FILTRO ATUAL
    max_score = total_habits_ref * score_map['1']
    min_score = total_habits_ref * score_map['0']
    
    if min_score < 0:
        scale = "RdYlGn"
    else:
        scale = "Greens"
        
    return score_map, [min_score, max_score], scale

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
        
        # --- SIDEBAR MODERNIZADA ---
        st.sidebar.header("Filter Data")
        
        # 1. Date Range (Mantemos simples)
        min_date = df['date'].min().date()
        max_date = df['date'].max().date()
        date_range = st.sidebar.date_input(
            "Period", 
            value=(min_date, max_date), 
            min_value=min_date, 
            max_value=max_date
        )
        
        st.sidebar.markdown("---")
        
        # 2. CATEGORIES: O visual "Pills" (Chips clicáveis)
        # Muito mais limpo que o multiselect. Parece um filtro de app mobile.
        st.sidebar.caption("Categories")
        all_types = sorted(df['type'].unique())
        
        # selection_mode="multi" permite selecionar vários
        selected_types = st.sidebar.pills(
            "Select categories:",
            all_types,
            default=all_types,
            selection_mode="multi",
            label_visibility="collapsed" # Remove o label repetitivo
        )
        
        # Tratamento de erro: Se o usuário desmarcar tudo, assumimos "Todos" ou paramos?
        # Geralmente em UX, desmarcar tudo = "Mostre nada" ou "Mostre tudo".
        # Vamos manter a lógica: se vazio, avisa o usuário.
        
        # 3. HABITS: Escondido num Expander (Minimalismo)
        # Só mostramos a "bagunça" de 21 hábitos se o usuário clicar para abrir.
        available_habits = sorted(df[df['type'].isin(selected_types or [])]['habit'].unique())
        
        with st.sidebar.expander("Detailed Habit Filter", expanded=False):
            # Adicionei um botão prático para selecionar/desmarcar todos lá dentro
            if st.button("Select All Habits"):
                st.session_state['habit_filter'] = available_habits
                st.rerun()
                
            selected_habits = st.multiselect(
                "Filter specific habits:",
                available_habits,
                default=available_habits,
                key='habit_filter',
                label_visibility="collapsed"
            )

        # Botão de Reset discreto no final
        if st.sidebar.button("Reset All Filters", type="secondary"):
            del st.session_state.habit_filter
            st.rerun()

        # --- APLICAÇÃO DOS FILTROS ---
        # Se selected_types for vazio (None ou lista vazia), trata para não quebrar
        if not selected_types:
            st.warning("Please select at least one Category.")
            return

        mask_date = (df['date'].dt.date >= date_range[0]) & (df['date'].dt.date <= date_range[1])
        mask_type = df['type'].isin(selected_types)
        mask_habit = df['habit'].isin(selected_habits)
        
        df_filtered = df[mask_date & mask_type & mask_habit].copy()
        
        if df_filtered.empty:
            st.warning("No data found for these filters.")
            return
        
        # DataFrame Filtrado
        df_filtered = df[mask_date & mask_type & mask_habit].copy()
        
        if df_filtered.empty:
            st.warning("No data visible. Try resetting your filters.")
            return

        # --- CÁLCULO DINÂMICO DO TOTAL (Baseado no Filtro) ---
        # Se filtrei só "Leitura", isso será 1.
        # Se não filtrei nada, será 21.
        total_filtered_habits = df_filtered['habit'].nunique()

        # --- KPI SECTION ---
        metrics = calculate_global_metrics(df_filtered)
        k1, k2, k3, k4 = st.columns(4)
        
        k1.metric("Success Rate", f"{metrics['success_rate']:.1%}", help="Taxa de sucesso (Feitos / Tentativas Totais)")
        k1.markdown(f"<div class='metric-secondary'>Hit: {metrics['success_count']} &nbsp;|&nbsp; Miss: {metrics['failure_count']}</div>", unsafe_allow_html=True)
        
        k2.metric("Best Month", metrics['best_month'], help="Mês com a maior média de sucesso")
        k2.markdown(f"<div class='metric-secondary text-success'>SR: {metrics['best_month_rate']:.1%}</div>", unsafe_allow_html=True)
        
        k3.metric("Worst Month", metrics['worst_month'], help="Mês com a menor média de sucesso")
        k3.markdown(f"<div class='metric-secondary text-danger'>SR: {metrics['worst_month_rate']:.1%}</div>", unsafe_allow_html=True)

        k4.metric("Perfect Days", metrics['perfect_days'], help="Dias com 100% de conclusão dos hábitos ativos")
        k4.markdown(f"<div class='metric-secondary'>100% Completion</div>", unsafe_allow_html=True)
        
        st.markdown("---")

        # --- TABS ---
        tab1, tab2, tab3, tab4 = st.tabs(["Overview", "Calendar", "Heatmap", "Data"])
        
        # === TAB 1: OVERVIEW ===
        with tab1:
            st.markdown("##### Consistency Trend")
            view_option = st.radio("Agrupar por:", ["Global", "Categoria"], horizontal=True, label_visibility="collapsed")
            
            if view_option == "Global":
                fig_trend = get_trend_chart(df_filtered, color_line=PRIMARY_COLOR)
            else:
                fig_trend = get_multiline_trend_chart(df_filtered, dimension='type')

            st.plotly_chart(fig_trend, use_container_width=True)
            
            st.markdown("---")
            
            st.markdown("##### Performance by Category")
            fig_cat = get_category_bar_chart(df_filtered, color_bar=PRIMARY_COLOR)
            fig_cat.update_layout(height=400) 
            st.plotly_chart(fig_cat, use_container_width=True)
            
            with st.expander("ℹ️ Como interpretar esta aba"):
                st.markdown("""
                * **Consistency Trend:** Mostra a evolução da sua disciplina ao longo do tempo (Média Móvel de 7 dias). Linha subindo = Melhoria.
                * **Performance by Category:** Ranking das áreas da sua vida. Barras maiores indicam maior taxa de sucesso. O valor 'N' indica quantos dias foram registrados.
                """)

        # === TAB 2: WALL CALENDAR ===
        with tab2:
            st.markdown("##### Monthly Calendar")
            
            # Passamos o total_filtered_habits (contexto atual)
            cal_map, cal_range, cal_scale = render_scoring_widget(
                key_suffix="cal", 
                total_habits_ref=total_filtered_habits
            )
            
            st.plotly_chart(
                get_wall_calendar_view(
                    df_filtered, 
                    score_map=cal_map, 
                    color_range=cal_range,
                    color_scale=cal_scale
                ), 
                use_container_width=True
            )
            
            with st.expander("ℹ️ Como interpretar esta aba"):
                st.markdown("""
                Visualização tradicional de calendário.
                * **Cor do Quadrado:** Indica o "Saldo do Dia". A escala se adapta automaticamente aos filtros aplicados.
                * **Verde Forte:** Dia de alta produtividade (próximo do máximo possível para os hábitos selecionados).
                * **Vermelho:** Dia onde as falhas superaram os acertos.
                """)

        # === TAB 3: HEATMAP ===
        with tab3:
            st.markdown("##### Annual Connectivity")
            
            # Passamos o total_filtered_habits (contexto atual)
            heat_map, heat_range, heat_scale = render_scoring_widget(
                key_suffix="heat", 
                total_habits_ref=total_filtered_habits
            )
            
            st.plotly_chart(
                get_productivity_heatmap(
                    df_filtered,
                    score_map=heat_map, 
                    color_range=heat_range,
                    color_scale=heat_scale
                ), 
                use_container_width=True
            )
            
            with st.expander("ℹ️ Como interpretar esta aba"):
                st.markdown("""
                Visão panorâmica do ano (Estilo GitHub).
                * **Eixo Horizontal:** Semanas do ano.
                * **Eixo Vertical:** Dias da semana (Segunda a Domingo).
                * Útil para detectar padrões macro.
                """)

        # === TAB 4: DATA ===
        with tab4:
            st.dataframe(df_filtered.sort_values('date', ascending=False), use_container_width=True, height=600)
            st.caption("Tabela contendo todos os registros brutos utilizados nos cálculos.")

    else:
        st.error("Connection Error.")

if __name__ == "__main__":
    main()