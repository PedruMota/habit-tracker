"""
Pulls your live Google Sheets data (via the same etl/connection.py used by
the Streamlit app) and writes it into the shape the React dashboard expects:
a list of {_year, _origin_sheet, rows: [...]} objects, one per month-sheet.

Requires credentials.json in the repo root (same as `streamlit run main.py`).
Writes to frontend/src/data/local-data.json, which is git-ignored — your
real habit history never gets committed. The React app picks it up
automatically over the bundled sample data whenever it's present.

Run whenever you want to refresh the local dashboard with today's data:
    python etl/export_for_frontend.py
"""
import json
from pathlib import Path

from connection import load_raw_data

OUT_PATH = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data" / "local-data.json"


def main():
    raw_list = load_raw_data()
    if not raw_list:
        print("No data returned — check credentials.json and that the service account has access to the sheets.")
        return

    sheets = []
    for df in raw_list:
        year = str(df["_year"].iloc[0])
        origin_sheet = str(df["_origin_sheet"].iloc[0])
        rows = df.to_dict(orient="records")
        sheets.append({"_year": year, "_origin_sheet": origin_sheet, "rows": rows})

    OUT_PATH.write_text(json.dumps(sheets, ensure_ascii=False, default=str), encoding="utf-8")
    total_rows = sum(len(s["rows"]) for s in sheets)
    print(f"Wrote {len(sheets)} month-sheets ({total_rows} habit-rows) to {OUT_PATH}")


if __name__ == "__main__":
    main()
