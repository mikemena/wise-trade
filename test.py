import json

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
