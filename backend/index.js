const express = require('express');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;
const fs = require('fs');
const app = express();
const PORT = 5001;

// Middleware
// app.use(cors());
app.use(
  cors({
    origin: '*'
  })
);
app.use(express.json());

// Helper function to fetch stock data for a given ticker
async function getStockInfo(ticker) {
  try {
    const stock = await yahooFinance.quote(ticker);

    // Fetch earnings data
    let earningsDate = 'Earnings date not available';
    try {
      const earningsSummary = await yahooFinance.quoteSummary(ticker, {
        modules: ['earnings'] // Request the earnings module
      });

      const earnings = earningsSummary.earnings;
      if (
        earnings &&
        earnings.earningsChart &&
        earnings.earningsChart.earningsDate
      ) {
        earningsDate = earnings.earningsChart.earningsDate.map(dateString => {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-US');
        });
      }
    } catch (error) {
      console.warn(`No earnings data found for ${ticker}: ${error.message}`);
      // Keep the default "Earnings date not available"
    }

    const currentPrice = stock.regularMarketPrice || 'N/A';
    const fiftyTwoWeekHigh = stock.fiftyTwoWeekHigh || 'N/A';

    // Calculate the percentage change from 52-week high to current price
    let highToCurrentChange = 'N/A';
    if (currentPrice !== 'N/A' && fiftyTwoWeekHigh !== 'N/A') {
      highToCurrentChange =
        (((currentPrice - fiftyTwoWeekHigh) / fiftyTwoWeekHigh) * 100).toFixed(
          2
        ) + '%';
    }

    return {
      Ticker: stock.symbol,
      CompanyName: stock.shortName,
      CurrentPrice: stock.regularMarketPrice || 'N/A',
      CurrentDate: new Date().toLocaleDateString(),
      FiftyTwoWeekHigh: stock.fiftyTwoWeekHigh || 'N/A',
      FiftyTwoWeekLow: stock.fiftyTwoWeekLow || 'N/A',
      MarketCap: stock.marketCap || 'N/A',
      Industry: stock.industry || 'N/A',
      Sector: stock.sector || 'N/A',
      CHANGE: stock.regularMarketChangePercent
        ? `${stock.regularMarketChangePercent.toFixed(2)}%`
        : 'N/A',
      HighToCurrentChange: highToCurrentChange,
      EarningsDate: earningsDate
    };
  } catch (error) {
    console.error(`Error fetching stock data for ${ticker}: ${error}`);
    return { error: `Failed to fetch data for ticker: ${ticker}` };
  }
}

// Helper function to load tickers from the JSON file
function loadTickers(category) {
  const data = fs.readFileSync('tickers.json');
  const tickers = JSON.parse(data);

  if (category === 'all') {
    return Object.values(tickers).flat();
  } else if (tickers[category]) {
    return tickers[category];
  } else {
    throw new Error(`Category '${category}' not found.`);
  }
}

// API endpoint to fetch stock data based on category or all
app.get('/api/stocks/:category', async (req, res) => {
  const { category } = req.params;

  try {
    const tickers = loadTickers(category.toLowerCase()); // Load tickers from JSON file
    const stockDataPromises = tickers.map(ticker => getStockInfo(ticker));
    const stockData = await Promise.all(stockDataPromises); // Wait for all promises
    res.json(stockData); // Send the response
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
