import requests
import pandas as pd

companies = []
demo = "your api key"
marketcap = str(1000000000)
url = f"https://financialmodelingprep.com/api/v3/stock-screener?marketCapMoreThan={marketcap}&betaMoreThan=1&volumeMoreThan=10000&sector=Technology&exchange=NASDAQ&dividendMoreThan=0&limit=1000&apikey={demo}"
# get companies based on criteria defined about
screener = requests.get(url).json()
print(screener)
