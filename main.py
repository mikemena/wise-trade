import yfinance as yf
from datetime import datetime
import pandas as pd
import json


def get_stock_info(ticker):
    stock = yf.Ticker(ticker)
    info = stock.info

    current_price = info.get("currentPrice", "N/A")
    current_date = datetime.now().strftime("%m/%d/%y")
    fifty_two_week_high = info.get("fiftyTwoWeekHigh", "N/A")
    fifty_two_week_low = info.get("fiftyTwoWeekLow", "N/A")
    market_cap = info.get("marketCap", "N/A")
    industry = info.get("industry", "N/A")
    sector = info.get("sector", "N/A")
    company_name = info.get("shortName", "N/A")

    if current_price != "N/A" and fifty_two_week_high != "N/A":
        change = (current_price - fifty_two_week_high) / fifty_two_week_high * 100
        change_str = f"{change:.2f}%"
    else:
        change_str = "N/A"

    return {
        "Ticker": ticker,
        "Company Name": company_name,
        "Current Price": current_price,
        "Current Date": current_date,
        "52 Week High": fifty_two_week_high,
        "52 Week Low": fifty_two_week_low,
        "Market Cap": market_cap,
        "Industry": industry,
        "Sector": sector,
        "CHANGE": change_str,
    }


def generate_stock_report(tickers):
    data = []
    for ticker in tickers:
        data.append(get_stock_info(ticker))

    df = pd.DataFrame(data)

    # Format currency fields
    df["Current Price"] = df["Current Price"].apply(
        lambda x: f"${x:.2f}" if x != "N/A" else "N/A"
    )
    df["52 Week High"] = df["52 Week High"].apply(
        lambda x: f"${x:.2f}" if x != "N/A" else "N/A"
    )
    df["52 Week Low"] = df["52 Week Low"].apply(
        lambda x: f"${x:.2f}" if x != "N/A" else "N/A"
    )
    df["Market Cap"] = df["Market Cap"].apply(
        lambda x: f"${x:,}" if x != "N/A" else "N/A"
    )

    # Convert "CHANGE" to numeric for sorting
    df["CHANGE"] = pd.to_numeric(df["CHANGE"].str.replace("%", ""), errors="coerce")

    # Sort by "CHANGE" in descending order
    df = df.sort_values(by="CHANGE", ascending=False)

    return df


def load_tickers(category=None):
    """Load tickers from a JSON file and return them based on category."""
    with open("tickers.json", "r") as f:
        ticker_data = json.load(f)

    if category == "all":
        # Combine all tickers into a single list
        all_tickers = []
        for tickers in ticker_data.values():
            all_tickers.extend(tickers)
        return all_tickers
    elif category in ticker_data:
        return ticker_data[category]
    else:
        raise ValueError(f"Category '{category}' not found in ticker list.")


def color_rows(val):
    """Apply color to rows based on 'CHANGE' percentage."""
    if pd.isna(val):
        return ""
    elif val >= 50:
        return "background-color: blue"
    elif 40 <= val < 50:
        return "background-color: green"
    elif 30 <= val < 40:
        return "background-color: red"
    elif 20 <= val < 30:
        return "background-color: orange"
    elif 10 <= val < 20:
        return "background-color: yellow"
    elif val >= 0:
        return ""
    else:
        return ""  # No color for other values


# Example usage
if __name__ == "__main__":
    category = (
        input("Enter the category (oil, tech, finance, or 'all' to run all): ")
        .strip()
        .lower()
    )

    try:
        tickers = load_tickers(category)
        report = generate_stock_report(tickers)

        # Apply color to rows
        styled_report = report.style.applymap(color_rows, subset=["CHANGE"])

        # Display styled report
        print(styled_report.to_html())  # Convert to HTML for better display
    except ValueError as e:
        print(e)
