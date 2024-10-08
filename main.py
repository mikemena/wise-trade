import yfinance as yf
from datetime import datetime
import pandas as pd


def get_stock_info(ticker):
    stock = yf.Ticker(ticker)
    info = stock.info

    current_price = info["currentPrice"]
    current_date = datetime.now().strftime("%m/%d/%y")
    fifty_two_week_high = info["fiftyTwoWeekHigh"]
    change = (current_price - fifty_two_week_high) / fifty_two_week_high * 100

    return {
        "Ticker": ticker,
        "Current Price": current_price,
        "Current Date": current_date,
        "52 Week High": fifty_two_week_high,
        "CHANGE": f"{change:.2f}%",
    }


def generate_stock_report(tickers):
    data = []
    for ticker in tickers:
        data.append(get_stock_info(ticker))

    df = pd.DataFrame(data)
    df["Current Price"] = df["Current Price"].apply(lambda x: f"${x:.2f}")
    df["52 Week High"] = df["52 Week High"].apply(lambda x: f"${x:.2f}")

    return df


# Example usage
tickers = ["AAPL", "GOOGL", "MSFT", "AMZN"]
report = generate_stock_report(tickers)
print(report.to_string(index=False))
