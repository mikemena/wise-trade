# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import yfinance as yf

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_tickers():
    with open("tickers.json", "r") as f:
        return json.load(f)

@app.get("/api/tickers")
def get_tickers():
    return load_tickers()

@app.get("/api/stocks/{category}")
def get_stocks(category: str):
    ticker_map = load_tickers()

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

            high_change = "N/A"
            if current and high:
                high_change = f"{((current - high) / high) * 100:.2f}%"

            results.append({
                "Ticker": symbol,
                "CompanyName": symbol,
                "CurrentPrice": current or "N/A",
                "FiftyTwoWeekHigh": high or "N/A",
                "FiftyTwoWeekLow": low or "N/A",
                "MarketCap": market_cap or "N/A",
                "CHANGE": "N/A",
                "HighToCurrentChange": high_change,
                "EarningsDate": "N/A",
            })

        except Exception:
            results.append({"Ticker": symbol, "error": "Failed to fetch data"})

    return results
