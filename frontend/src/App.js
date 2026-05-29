import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Header from "./components/header";

function App() {
  const categories = [
    { value: "all", label: "All" },
    { value: "oil", label: "Oil" },
    { value: "tech", label: "Tech" },
    { value: "finance", label: "Finance" },
    { value: "chips", label: "Chips" },
    { value: "etf", label: "ETF" },
    { value: "ai", label: "AI" },
    { value: "energy", label: "Energy" },
    { value: "airlines", label: "Airlines" },
    { value: "travel", label: "Travel" },
    { value: "hotels", label: "Hotels" },
    { value: "shipping", label: "Shipping" },
    { value: "builders", label: "Builders" },
    { value: "materials", label: "Materials" },
    { value: "psychedelic", label: "Psychedelic" },
  ];

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [allStockData, setAllStockData] = useState([]); // all fetched stocks, never changes after load
  const [tickerMap, setTickerMap] = useState({}); // { oil: ['MPC', ...], tech: [...], ... }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [filters, setFilters] = useState({
    Ticker: "",
    CompanyName: "",
    CurrentPrice: "",
    FiftyTwoWeekHigh: "",
    FiftyTwoWeekLow: "",
    MarketCap: "",
    CHANGE: "",
    HighToCurrentChange: "",
  });

  // Fetch ALL stock data once on mount — no re-fetching when category changes
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [tickersRes, stocksRes] = await Promise.all([
          axios.get("http://localhost:5001/api/tickers"),
          axios.get("http://localhost:5001/api/stocks/all"),
        ]);
        setTickerMap(tickersRes.data);
        setAllStockData(stocksRes.data);
      } catch (err) {
        setError("Error fetching stock data");
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Filter allStockData by selected category — pure client-side, no API call
  const categoryStocks = useMemo(() => {
    if (selectedCategory === "all") return allStockData;
    const tickers = tickerMap[selectedCategory] || [];
    return allStockData.filter((stock) => tickers.includes(stock.Ticker));
  }, [allStockData, tickerMap, selectedCategory]);

  // Sort — fixed to safely handle numbers, strings, and percentage strings
  const sortedData = useMemo(() => {
    return [...categoryStocks].sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Percentage columns: strip '%' and parse as float
      if (
        sortConfig.key === "HighToCurrentChange" ||
        sortConfig.key === "CHANGE"
      ) {
        aValue = parseFloat((aValue ?? "0").toString().replace("%", "")) || 0;
        bValue = parseFloat((bValue ?? "0").toString().replace("%", "")) || 0;
      }

      // Numeric comparison
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "ascending"
          ? aValue - bValue
          : bValue - aValue;
      }

      // String comparison (Ticker, CompanyName, etc.)
      const aStr = (aValue ?? "").toString().toLowerCase();
      const bStr = (bValue ?? "").toString().toLowerCase();
      if (aStr < bStr) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [categoryStocks, sortConfig]);

  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  const filteredData = useMemo(() => {
    return sortedData.filter((stock) => {
      return (
        (stock.Ticker?.toLowerCase() || "").includes(
          filters.Ticker.toLowerCase(),
        ) &&
        (stock.CompanyName?.toLowerCase() || "").includes(
          filters.CompanyName.toLowerCase(),
        ) &&
        String(stock.CurrentPrice || "").includes(filters.CurrentPrice) &&
        String(stock.FiftyTwoWeekHigh || "").includes(
          filters.FiftyTwoWeekHigh,
        ) &&
        String(stock.FiftyTwoWeekLow || "").includes(filters.FiftyTwoWeekLow) &&
        String(stock.MarketCap || "").includes(filters.MarketCap) &&
        String(stock.CHANGE || "").includes(filters.CHANGE) &&
        String(stock.HighToCurrentChange || "").includes(
          filters.HighToCurrentChange,
        )
      );
    });
  }, [sortedData, filters]);

  const getBackgroundColor = (val) => {
    if (val === "N/A" || isNaN(parseFloat(val))) return "";
    const percentage = parseFloat(val.replace("%", ""));
    if (percentage <= -50) return "rgba(187, 44, 62, 1)";
    if (percentage < -40) return "rgba(187, 44, 62, 0.9)";
    if (percentage < -30) return "rgba(187, 44, 62, 0.8)";
    if (percentage < -20) return "rgba(187, 44, 62, 0.7)";
    if (percentage < -10) return "rgba(187, 44, 62, 0.6)";
    return "";
  };

  const shouldUseWhiteText = (val) =>
    getBackgroundColor(val) !== "" ? "#F2EFE9" : "";

  const getPriceChangeColor = (val) => {
    if (val === "N/A" || isNaN(parseFloat(val))) return "";
    const percentage = parseFloat(val.replace("%", ""));
    if (percentage < 0) return "#BB2C3E";
    if (percentage > 0.1) return "#3E7C59";
    return "";
  };

  const usePriceChangeWhiteText = (val) =>
    getPriceChangeColor(val) !== "" ? "#F2EFE9" : "";

  // Sort indicator arrow for column headers
  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return " ↕";
    return sortConfig.direction === "ascending" ? " ↑" : " ↓";
  };

  return (
    <div>
      <Header />
      <h1 className="header">Stock Data</h1>

      <div id="select-category">
        <label>Select Category: </label>
        <select
          id="category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading all stock data...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <table className="table-bordered" cellPadding="10" cellSpacing="0">
          <thead>
            <tr>
              <th
                onClick={() => requestSort("Ticker")}
                style={{ cursor: "pointer" }}
              >
                Ticker{getSortArrow("Ticker")}
              </th>
              <th
                onClick={() => requestSort("CompanyName")}
                style={{ cursor: "pointer" }}
              >
                Company Name{getSortArrow("CompanyName")}
              </th>
              <th
                onClick={() => requestSort("CurrentPrice")}
                style={{ cursor: "pointer" }}
              >
                Current Price{getSortArrow("CurrentPrice")}
              </th>
              <th
                onClick={() => requestSort("FiftyTwoWeekHigh")}
                style={{ cursor: "pointer" }}
              >
                52 Week High{getSortArrow("FiftyTwoWeekHigh")}
              </th>
              <th
                onClick={() => requestSort("FiftyTwoWeekLow")}
                style={{ cursor: "pointer" }}
              >
                52 Week Low{getSortArrow("FiftyTwoWeekLow")}
              </th>
              <th
                onClick={() => requestSort("MarketCap")}
                style={{ cursor: "pointer" }}
              >
                Market Cap{getSortArrow("MarketCap")}
              </th>
              <th
                onClick={() => requestSort("CHANGE")}
                style={{ cursor: "pointer" }}
              >
                Change{getSortArrow("CHANGE")}
              </th>
              <th
                onClick={() => requestSort("HighToCurrentChange")}
                style={{ cursor: "pointer" }}
              >
                % Change from 52 Week High{getSortArrow("HighToCurrentChange")}
              </th>
              <th
                onClick={() => requestSort("EarningsDate")}
                style={{ cursor: "pointer" }}
              >
                Earnings Date{getSortArrow("EarningsDate")}
              </th>
            </tr>
            <tr className="filter-row">
              <th className="filter-cell">
                <input
                  type="text"
                  value={filters.Ticker}
                  className="filter-input"
                  onChange={(e) =>
                    setFilters({ ...filters, Ticker: e.target.value })
                  }
                />
              </th>
              <th className="filter-cell">
                <input
                  type="text"
                  value={filters.CompanyName}
                  className="filter-input"
                  onChange={(e) =>
                    setFilters({ ...filters, CompanyName: e.target.value })
                  }
                />
              </th>
              <th className="filter-cell"></th>
              <th className="filter-cell"></th>
              <th className="filter-cell"></th>
              <th className="filter-cell"></th>
              <th className="filter-cell"></th>
              <th className="filter-cell"></th>
              <th className="filter-cell"></th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((stock, index) => (
              <tr key={index}>
                <td>{stock.Ticker}</td>
                <td>{stock.CompanyName}</td>
                <td>
                  $
                  {typeof stock.CurrentPrice === "number"
                    ? stock.CurrentPrice.toFixed(2)
                    : stock.CurrentPrice}
                </td>
                <td>
                  {typeof stock.FiftyTwoWeekHigh === "number"
                    ? `$${stock.FiftyTwoWeekHigh.toFixed(2)}`
                    : stock.FiftyTwoWeekHigh}
                </td>
                <td>
                  {typeof stock.FiftyTwoWeekLow === "number"
                    ? `$${stock.FiftyTwoWeekLow.toFixed(2)}`
                    : stock.FiftyTwoWeekLow}
                </td>
                <td>
                  {stock.MarketCap !== "N/A" && stock.MarketCap
                    ? `$${(stock.MarketCap / 1e9).toFixed(2)}B`
                    : "N/A"}
                </td>
                <td
                  style={{
                    backgroundColor: getPriceChangeColor(stock.CHANGE),
                    color: usePriceChangeWhiteText(stock.CHANGE),
                  }}
                >
                  {stock.CHANGE}
                </td>
                <td
                  style={{
                    backgroundColor: getBackgroundColor(
                      stock.HighToCurrentChange,
                    ),
                    color: shouldUseWhiteText(stock.HighToCurrentChange),
                  }}
                >
                  {stock.HighToCurrentChange}
                </td>
                <td>
                  {Array.isArray(stock.EarningsDate)
                    ? stock.EarningsDate.join(", ")
                    : stock.EarningsDate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
