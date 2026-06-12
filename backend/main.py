# main.py
from pathlib import Path
from typing import Any
import json

from fastapi import FastAPI, HTTPException
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
STOCKS_FILE = BASE_DIR / "stocks.json"
SOLD_TICKERS_FILE = BASE_DIR / "sold_tickers.json"
STARRED_TICKERS_FILE = BASE_DIR / "starred_tickers.json"


def load_json_file(file_path: Path, default: Any):
    if not file_path.exists():
        return default

    with file_path.open("r") as f:
        return json.load(f)


def load_stocks():
    # Master stock list AND profile cache, keyed by ticker, e.g.
    # {"AAPL": {"name": "Apple Inc.", "sector": "Technology", "industry": "Consumer Electronics"}}
    # A bare entry like {"NVDA": {}} is valid: the profile is lazily
    # fetched from yfinance on the next load and written back.
    return load_json_file(STOCKS_FILE, {})


def save_stocks(stocks):
    with STOCKS_FILE.open("w") as f:
        json.dump(stocks, f, indent=2, sort_keys=True)
        f.write("\n")


def load_sold_tickers():
    return load_json_file(SOLD_TICKERS_FILE, {})


def load_starred_tickers():
    # Stored as a simple JSON array of ticker symbols, e.g. ["AAPL", "NVDA"]
    return load_json_file(STARRED_TICKERS_FILE, [])


def save_starred_tickers(starred):
    with STARRED_TICKERS_FILE.open("w") as f:
        json.dump(sorted(starred), f, indent=2)
        f.write("\n")


def fetch_profile(stock):
    """Fetch {name, sector, industry} via the slow stock.info call.

    Returns None when no name could be found (unknown ticker or a
    failed request), so callers can decide whether to cache or retry.
    """
    try:
        info = stock.info
        name = info.get("longName") or info.get("shortName")
        # ETFs and some tickers don't report these; fall back to N/A.
        sector = info.get("sector") or "N/A"
        industry = info.get("industry") or "N/A"
    except Exception:
        return None

    if not name:
        return None

    return {"name": name, "sector": sector, "industry": industry}


def ensure_profile(stock, symbol, stocks):
    """Return (profile, was_fetched), lazily filling missing profiles.

    A profile counts as filled once it has a name. Failed lookups are
    not written back, so they get retried on the next request.
    """
    entry = stocks.get(symbol) or {}
    if entry.get("name"):
        return entry, False

    profile = fetch_profile(stock)
    if profile:
        stocks[symbol] = profile
        return profile, True

    return {"name": symbol, "sector": "N/A", "industry": "N/A"}, False


def calculate_percentage_change(current, comparison_price):
    try:
        current = float(current)
        comparison_price = float(comparison_price)
    except (TypeError, ValueError):
        return "N/A"

    if comparison_price == 0:
        return "N/A"

    return f"{((current - comparison_price) / comparison_price) * 100:.2f}%"


def build_stock_row(symbol, stocks, sold_tickers):
    """Fetch live data for one ticker and assemble the API row.

    Returns (row, was_fetched) where was_fetched signals that the
    profile cache in `stocks` was updated and should be saved.
    """
    stock = yf.Ticker(symbol)
    fast = stock.fast_info

    current = fast.get("lastPrice")
    high = fast.get("yearHigh")
    low = fast.get("yearLow")
    market_cap = fast.get("marketCap")
    previous_close = fast.get("previousClose")

    profile, was_fetched = ensure_profile(stock, symbol, stocks)

    sold_info = sold_tickers.get(symbol, {})
    date_sold = sold_info.get("date_sold", "N/A")
    price_sold = sold_info.get("price_sold", "N/A")

    row = {
        "Ticker": symbol,
        "CompanyName": profile["name"],
        "Sector": profile.get("sector", "N/A"),
        "Industry": profile.get("industry", "N/A"),
        "CurrentPrice": current or "N/A",
        "FiftyTwoWeekHigh": high or "N/A",
        "FiftyTwoWeekLow": low or "N/A",
        "MarketCap": market_cap or "N/A",
        "CHANGE": calculate_percentage_change(current, previous_close),
        "HighToCurrentChange": calculate_percentage_change(current, high),
        "DateSold": date_sold,
        "PriceSold": price_sold,
        "SoldToCurrentChange": calculate_percentage_change(current, price_sold),
    }

    return row, was_fetched


@app.get("/api/stocks")
def get_stocks():
    stocks = load_stocks()
    sold_tickers = load_sold_tickers()
    cache_updated = False

    results = []

    for symbol in sorted(stocks.keys()):
        try:
            row, was_fetched = build_stock_row(symbol, stocks, sold_tickers)
            if was_fetched:
                cache_updated = True
            results.append(row)
        except Exception:
            results.append({"Ticker": symbol, "error": "Failed to fetch data"})

    if cache_updated:
        save_stocks(stocks)

    return results


@app.post("/api/stocks/{symbol}")
def add_stock(symbol: str):
    """Validate a new ticker against Yahoo, add it to stocks.json,
    and return its full data row so the frontend can append it."""
    symbol = symbol.strip().upper()

    if not symbol:
        raise HTTPException(status_code=400, detail="Ticker symbol is required")

    stocks = load_stocks()

    if symbol in stocks:
        raise HTTPException(status_code=409, detail=f"{symbol} is already in the list")

    profile = fetch_profile(yf.Ticker(symbol))
    if profile is None:
        raise HTTPException(
            status_code=404,
            detail=f"Could not find '{symbol}' on Yahoo Finance",
        )

    stocks[symbol] = profile
    save_stocks(stocks)

    try:
        row, _ = build_stock_row(symbol, stocks, load_sold_tickers())
    except Exception:
        raise HTTPException(
            status_code=502,
            detail=f"Added {symbol}, but fetching price data failed. Refresh to retry.",
        )

    return row


@app.get("/api/sold-tickers")
def get_sold_tickers():
    return load_sold_tickers()


@app.get("/api/starred-tickers")
def get_starred_tickers():
    return load_starred_tickers()


@app.post("/api/star/{symbol}")
def toggle_star(symbol: str):
    """Toggle a ticker's starred state and persist it to starred_tickers.json."""
    symbol = symbol.upper()
    starred = set(load_starred_tickers())

    if symbol in starred:
        starred.remove(symbol)
        is_starred = False
    else:
        starred.add(symbol)
        is_starred = True

    save_starred_tickers(starred)
    return {"ticker": symbol, "starred": is_starred}
