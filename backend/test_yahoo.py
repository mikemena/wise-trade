# test_yahoo.py
import yfinance as yf

ticker = yf.Ticker("AAPL")

info = ticker.fast_info
calendar = ticker.calendar

print("Price:", info.get("last_price"))
print("52W High:", info.get("year_high"))
print("52W Low:", info.get("year_low"))
print("Market Cap:", info.get("market_cap"))
print("Calendar:", calendar)
