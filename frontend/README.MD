# Wise Trades

Wise Trades is a stock dashboard application built with a React frontend and a Python FastAPI backend.

The application displays categorized stock data sourced from Yahoo Finance through the `yfinance` package. Users can sort, filter, and analyze stocks by category, including Oil, Tech, Finance, Chips, AI, Energy, Airlines, Travel, Hotels, Shipping, Builders, and Materials.

---

# Tech Stack

## Frontend

* React
* Axios
* CSS

## Backend

* Python
* FastAPI
* Uvicorn
* yfinance

## Development Tools

* Node.js
* npm
* concurrently
* Python Virtual Environment (`venv`)

---

# Project Structure

```text
wise-trade/
├── .venv/
│
├── backend/
│   ├── main.py
│   ├── test_yahoo.py
│   └── tickers.json
│
├── frontend/
│   ├── public/
│   │   └── assets/
│   │       └── images/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── header.js
│   │   │   └── header.css
│   │   │
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── package.json
├── package-lock.json
├── requirements.txt
└── README.md
```

---

# Components

## Backend

### main.py

FastAPI application that exposes REST endpoints for retrieving stock data.

Endpoints:

```text
GET /api/tickers
GET /api/stocks/{category}
```

Responsibilities:

* Loads ticker categories from `tickers.json`
* Retrieves stock data from Yahoo Finance
* Formats data for the React frontend
* Returns JSON responses

---

### tickers.json

Stores stock tickers grouped by category.

Example:

```json
{
  "oil": ["MPC", "OXY", "CVX", "XOM"],
  "tech": ["AAPL", "MSFT", "GOOGL", "AMZN"]
}
```

---

### test_yahoo.py

Used to verify that Yahoo Finance is returning data correctly.

Example:

```bash
python test_yahoo.py
```

---

## Frontend

### App.js

Main React component.

Responsibilities:

* Loads stock data from the backend
* Displays stock table
* Supports sorting
* Supports filtering
* Applies color formatting based on stock performance
* Supports category selection

---

### header.js

Displays the Wise Trades logo and page title.

---

### index.css

Contains:

* Page styling
* Table styling
* Filter styling
* Color formatting rules

---

# How It Works

1. User loads the React application.
2. React calls the backend API.
3. FastAPI loads ticker information.
4. FastAPI retrieves stock data using Yahoo Finance.
5. Backend returns JSON.
6. React displays the data in a sortable and filterable table.

Data Flow:

```text
React
  ↓
FastAPI
  ↓
Yahoo Finance (yfinance)
  ↓
FastAPI
  ↓
React UI
```

---

# Python Virtual Environment Setup

Create the virtual environment:

```bash
python -m venv .venv
```

Activate the environment:

### Mac/Linux

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

If requirements.txt does not exist:

```bash
pip install fastapi uvicorn yfinance pandas
```

Create requirements.txt:

```bash
pip freeze > requirements.txt
```

---

# Running the Backend

Activate the virtual environment:

```bash
source .venv/bin/activate
```

Navigate to the backend directory:

```bash
cd backend
```

Start FastAPI:

```bash
uvicorn main:app --reload --port 5001
```

Backend URL:

```text
http://localhost:5001
```

---

# Running the Frontend

Open a second terminal.

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start React:

```bash
npm start
```

Frontend URL:

```text
http://localhost:3000
```

---

# Running Frontend and Backend Together

Root package.json:

```json
{
  "name": "wise-trade",
  "version": "1.0.0",
  "scripts": {
    "start": "concurrently \"npm run server\" \"npm run client\"",
    "server": "cd backend && ../.venv/bin/uvicorn main:app --reload --port 5001",
    "client": "cd frontend && npm start"
  },
  "devDependencies": {
    "concurrently": "^9.0.1"
  }
}
```

Install root dependencies:

```bash
npm install
```

Run everything:

```bash
npm start
```

This launches:

```text
Backend:  http://localhost:5001
Frontend: http://localhost:3000
```

---

# API Endpoints

## Get Tickers

```http
GET /api/tickers
```

Returns:

```json
{
  "oil": ["MPC", "OXY"],
  "tech": ["AAPL", "MSFT"]
}
```

---

## Get Stocks By Category

```http
GET /api/stocks/oil
```

Example response:

```json
[
  {
    "Ticker": "MPC",
    "CompanyName": "MPC",
    "CurrentPrice": 248.77,
    "FiftyTwoWeekHigh": 264.14,
    "FiftyTwoWeekLow": 155.93,
    "MarketCap": 72630000000,
    "CHANGE": "N/A",
    "HighToCurrentChange": "-5.82%"
  }
]
```

---

# Testing Yahoo Finance

Run:

```bash
cd backend
python test_yahoo.py
```

Expected output:

```text
Price: 312.06
52W High: 313.26
52W Low: 195.07
Market Cap: 4583340000000
```

If this works, Yahoo Finance is available.

---

# Troubleshooting

## Could not import module "main"

Run from the backend directory:

```bash
cd backend
uvicorn main:app --reload --port 5001
```

---

## Port 3000 Already Running

```bash
lsof -ti:3000 | xargs kill -9
```

---

## Port 5001 Already Running

```bash
lsof -ti:5001 | xargs kill -9
```

---

## All Values Show N/A

Verify:

1. Backend is running.
2. `test_yahoo.py` works.
3. `main.py` uses:

```python
fast.get("lastPrice")
fast.get("yearHigh")
fast.get("yearLow")
fast.get("marketCap")
```

---

# Future Improvements

* Cache Yahoo Finance responses
* Parallel stock retrieval
* Company name lookup
* Earnings date support
* Daily percentage change support
* Mobile-responsive layout
* Export to CSV
* Watchlists and favorites
