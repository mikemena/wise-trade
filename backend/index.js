const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 5001;

// *** Paste your Finnhub API key here ***
const FINNHUB_API_KEY = "d7fcht1r01qpjqqkb860d7fcht1r01qpjqqkb86g";

const BASE_URL = "https://finnhub.io/api/v1";

app.use(cors({ origin: "*" }));
app.use(express.json());

// Helper to call Finnhub endpoints
async function finnhubFetch(endpoint) {
  const url = `${BASE_URL}${endpoint}&token=${FINNHUB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Finnhub responded with status ${res.status}`);
  return res.json();
}

// Fetch all data for a single ticker
async function getStockInfo(ticker) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const [quote, profile, metrics, earnings] = await Promise.all([
      finnhubFetch(`/quote?symbol=${ticker}`),
      finnhubFetch(`/stock/profile2?symbol=${ticker}`),
      finnhubFetch(`/stock/metric?symbol=${ticker}&metric=all`),
      finnhubFetch(
        `/calendar/earnings?symbol=${ticker}&from=${today}&to=${in90Days}`,
      ),
    ]);

    const currentPrice = quote.c || "N/A";
    const fiftyTwoWeekHigh = metrics.metric?.["52WeekHigh"] || "N/A";
    const fiftyTwoWeekLow = metrics.metric?.["52WeekLow"] || "N/A";

    let highToCurrentChange = "N/A";
    if (currentPrice !== "N/A" && fiftyTwoWeekHigh !== "N/A") {
      highToCurrentChange =
        (((currentPrice - fiftyTwoWeekHigh) / fiftyTwoWeekHigh) * 100).toFixed(
          2,
        ) + "%";
    }

    // Finnhub returns marketCapitalization in millions USD.
    // Multiply by 1e6 so the frontend's /1e9 math shows correct billions.
    const marketCap = profile.marketCapitalization
      ? profile.marketCapitalization * 1e6
      : "N/A";

    let earningsDate = "Earnings date not available";
    if (earnings.earningsCalendar && earnings.earningsCalendar.length > 0) {
      earningsDate = earnings.earningsCalendar.map((e) =>
        new Date(e.date).toLocaleDateString("en-US"),
      );
    }

    return {
      Ticker: ticker,
      CompanyName: profile.name || "N/A",
      CurrentPrice: currentPrice,
      CurrentDate: new Date().toLocaleDateString(),
      FiftyTwoWeekHigh: fiftyTwoWeekHigh,
      FiftyTwoWeekLow: fiftyTwoWeekLow,
      MarketCap: marketCap,
      Industry: profile.finnhubIndustry || "N/A",
      Sector: profile.finnhubIndustry || "N/A",
      CHANGE: quote.dp != null ? `${quote.dp.toFixed(2)}%` : "N/A",
      HighToCurrentChange: highToCurrentChange,
      EarningsDate: earningsDate,
    };
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error.message);
    return { error: `Failed to fetch data for ticker: ${ticker}` };
  }
}

// Load tickers from JSON file
function loadTickers(category) {
  const data = fs.readFileSync("tickers.json");
  const tickers = JSON.parse(data);
  if (category === "all") return Object.values(tickers).flat();
  if (tickers[category]) return tickers[category];
  throw new Error(`Category '${category}' not found.`);
}

// Expose tickers.json to the frontend so it can filter by category client-side
app.get("/api/tickers", (req, res) => {
  const data = fs.readFileSync("tickers.json");
  res.json(JSON.parse(data));
});

// Stock data endpoint
app.get("/api/stocks/:category", async (req, res) => {
  const { category } = req.params;
  try {
    const tickers = loadTickers(category.toLowerCase());
    const results = [];

    // Batch in groups of 12 to stay under Finnhub's 60 calls/min free tier
    // (12 stocks × 4 calls each = 48 calls/batch)
    const BATCH_SIZE = 12;
    for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
      const batch = tickers.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map((t) => getStockInfo(t)));
      results.push(...batchResults);
      if (i + BATCH_SIZE < tickers.length) {
        await new Promise((r) => setTimeout(r, 1100));
      }
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
