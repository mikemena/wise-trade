# 📈 Stock Dashboard

A full-stack stock tracking dashboard built with **React** (frontend) and **Express** (backend). It pulls real-time stock data from Yahoo Finance and displays price, market cap, 52-week highs/lows, daily change, and upcoming earnings dates — all filterable and sortable by category.

---

## Features

- Browse stocks across 15 categories: Oil, Tech, Finance, Chips, AI, Energy, Airlines, Travel, Hotels, Shipping, Builders, Materials, and more
- Real-time data via Yahoo Finance API
- Sortable columns (click any header)
- Filter by Ticker or Company Name
- Color-coded daily change and % from 52-week high
- Earnings date display

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, Axios                        |
| Backend  | Node.js, Express, yahoo-finance2    |

---

## Project Structure

```
/
├── tickers.json        # Categorized list of stock tickers
├── index.js            # Express backend server
└── src/
    ├── index.js        # React entry point
    ├── App.js          # Main React component
    ├── index.css       # Global styles
    └── components/
        └── header.js   # Header component
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v16 or higher
- npm

---

### 1. Install Backend Dependencies

From the project root (where `index.js` and `tickers.json` live):

```bash
npm install express cors yahoo-finance2
```

### 2. Install Frontend Dependencies

From the React app directory (where `src/` lives):

```bash
npm install
```

If starting fresh:

```bash
npx create-react-app .
npm install axios
```

---

## Running the App

You need to run **two processes** — the backend and the frontend — at the same time.

### Start the Backend (Terminal 1)

```bash
node index.js
```

The API server will start at: `http://localhost:5001`

### Start the Frontend (Terminal 2)

```bash
npm start
```

The React app will open at: `http://localhost:3000`

---

## API Reference

### `GET /api/stocks/:category`

Returns stock data for the given category.

**Available categories:**
`all`, `oil`, `tech`, `finance`, `chips`, `ai`, `energy`, `airlines`, `travel`, `hotels`, `shipping`, `builders`, `materials`, `memory`

**Example:**
```
GET http://localhost:5001/api/stocks/tech
```

**Response fields per stock:**

| Field               | Description                          |
|---------------------|--------------------------------------|
| `Ticker`            | Stock symbol                         |
| `CompanyName`       | Short company name                   |
| `CurrentPrice`      | Latest market price                  |
| `FiftyTwoWeekHigh`  | 52-week high price                   |
| `FiftyTwoWeekLow`   | 52-week low price                    |
| `MarketCap`         | Market capitalization                |
| `CHANGE`            | Daily % price change                 |
| `HighToCurrentChange` | % drop from 52-week high           |
| `EarningsDate`      | Upcoming earnings date(s)            |

---

## Adding Tickers

Edit `tickers.json` to add or remove tickers from any category, or create a new category:

```json
{
  "myCategory": ["AAPL", "MSFT", "GOOGL"]
}
```

The new category will automatically appear as an option in the frontend dropdown.

> **Note:** After adding a category to `tickers.json`, also add it to the `categories` array in `App.js` so it appears in the dropdown.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `CORS error` in browser | Ensure the backend is running on port 5001 |
| `Cannot find module 'yahoo-finance2'` | Run `npm install yahoo-finance2` in the backend directory |
| `Error fetching stock data` | Check your internet connection; Yahoo Finance may rate-limit heavy requests |
| Earnings date shows "not available" | Some tickers don't have earnings data available via Yahoo Finance |
