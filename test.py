import json

import requests


# Load the configuration from config.json
with open("config.json", "r") as config_file:
    config = json.load(config_file)

# Access the API key from the loaded configuration
api_key = config.get("api_key")

if api_key:
    # Use the API key in your code
    print("API Key:", api_key)
else:
    print("API Key not found in the configuration file.")

# Build TimeSeries variable from Alpha Vantage API
# replace the "demo" apikey below with your own key from https://www.alphavantage.co/support/#api-key
url = "https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=IBM&{api_key}=demo"
r = requests.get(url)
data = r.json()

print(data)
