# main.py
from pathlib import Path
from typing import Any
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
TICKERS_FILE = BASE_DIR / "tickers.json"
SOLD_TICKERS_FILE = BASE_DIR / "sold_tickers.json"


def load_json_file(file_path: Path, default: Any):
    if not file_path.exists():
        return default

    with file_path.open("r") as f:
        return json.load(f)


def load_tickers():
    return load_json_file(TICKERS_FILE, {})


def load_sold_tickers():
    return load_json_file(SOLD_TICKERS_FILE, {})


def calculate_percentage_change(current, comparison_price):
    try:
        current = float(current)
        comparison_price = float(comparison_price)
    except (TypeError, ValueError):
        return "N/A"

    if comparison_price == 0:
        return "N/A"

    return f"{((current - comparison_price) / comparison_price) * 100:.2f}%"


@app.get("/api/tickers")
def get_tickers():
    return load_tickers()


@app.get("/api/sold-tickers")
def get_sold_tickers():
    return load_sold_tickers()


@app.get("/api/stocks/{category}")
def get_stocks(category: str):
    ticker_map = load_tickers()
    sold_tickers = load_sold_tickers()

    if category == "all":
        tickers = [t for group in ticker_map.values() for t in group]
    else:
        tickers = ticker_map.get(category, [])

    results = []

    for symbol in tickers:
        try:
            stock = yf.Ticker(symbol)
            fast = stock.fast_info

            current = fast.get("lastPrice")
            high = fast.get("yearHigh")
            low = fast.get("yearLow")
            market_cap = fast.get("marketCap")

            print(symbol, dict(fast))

            sold_info = sold_tickers.get(symbol, {})
            date_sold = sold_info.get("date_sold", "N/A")
            price_sold = sold_info.get("price_sold", "N/A")

            high_change = calculate_percentage_change(current, high)
            sold_to_current_change = calculate_percentage_change(current, price_sold)

            results.append({
                "Ticker": symbol,
                "CompanyName": symbol,
                "CurrentPrice": current or "N/A",
                "FiftyTwoWeekHigh": high or "N/A",
                "FiftyTwoWeekLow": low or "N/A",
                "MarketCap": market_cap or "N/A",
                "CHANGE": "N/A",
                "HighToCurrentChange": high_change,
                "DateSold": date_sold,
                "PriceSold": price_sold,
                "SoldToCurrentChange": sold_to_current_change
            })

        except Exception:
            results.append({"Ticker": symbol, "error": "Failed to fetch data"})

    return results
