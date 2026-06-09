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
    { value: "memory", label: "Memory" },
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
  const [allStockData, setAllStockData] = useState([]);
  const [tickerMap, setTickerMap] = useState({});
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
    DateSold: "",
    PriceSold: "",
    SoldToCurrentChange: "",
  });

  const percentageColumns = [
    "CHANGE",
    "HighToCurrentChange",
    "SoldToCurrentChange",
  ];

  const numericColumns = [
    "CurrentPrice",
    "FiftyTwoWeekHigh",
    "FiftyTwoWeekLow",
    "MarketCap",
    "PriceSold",
  ];

  const dateColumns = ["DateSold"];

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

  const categoryStocks = useMemo(() => {
    if (selectedCategory === "all") return allStockData;

    const tickers = tickerMap[selectedCategory] || [];
    return allStockData.filter((stock) => tickers.includes(stock.Ticker));
  }, [allStockData, tickerMap, selectedCategory]);

  const parsePercentage = (value) => {
    const parsed = parseFloat((value ?? "").toString().replace("%", ""));
    return Number.isNaN(parsed) ? null : parsed;
  };

  const parseNumber = (value) => {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const parseDate = (value) => {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? null : timestamp;
  };

  const compareNullableValues = (aValue, bValue) => {
    const directionMultiplier = sortConfig.direction === "ascending" ? 1 : -1;

    // Keep N/A or blank values at the bottom for both ascending and descending sorts.
    if (aValue === null && bValue === null) return 0;
    if (aValue === null) return 1;
    if (bValue === null) return -1;

    if (aValue < bValue) return -1 * directionMultiplier;
    if (aValue > bValue) return 1 * directionMultiplier;
    return 0;
  };

  const sortedData = useMemo(() => {
    return [...categoryStocks].sort((a, b) => {
      if (!sortConfig.key) return 0;

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (percentageColumns.includes(sortConfig.key)) {
        return compareNullableValues(
          parsePercentage(aValue),
          parsePercentage(bValue),
        );
      }

      if (numericColumns.includes(sortConfig.key)) {
        return compareNullableValues(parseNumber(aValue), parseNumber(bValue));
      }

      if (dateColumns.includes(sortConfig.key)) {
        return compareNullableValues(parseDate(aValue), parseDate(bValue));
      }

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
        ) &&
        String(stock.DateSold || "").includes(filters.DateSold) &&
        String(stock.PriceSold || "").includes(filters.PriceSold) &&
        String(stock.SoldToCurrentChange || "").includes(
          filters.SoldToCurrentChange,
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

  const formatCurrency = (value) => {
    if (typeof value === "number") return `$${value.toFixed(2)}`;
    return value || "N/A";
  };

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
                onClick={() => requestSort("DateSold")}
                style={{ cursor: "pointer" }}
              >
                Date Sold{getSortArrow("DateSold")}
              </th>

              <th
                onClick={() => requestSort("PriceSold")}
                style={{ cursor: "pointer" }}
              >
                Price Sold{getSortArrow("PriceSold")}
              </th>

              <th
                onClick={() => requestSort("SoldToCurrentChange")}
                style={{ cursor: "pointer" }}
              >
                % Change Since Sold{getSortArrow("SoldToCurrentChange")}
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

              <th className="filter-cell">
                <input
                  type="text"
                  value={filters.DateSold}
                  className="filter-input"
                  onChange={(e) =>
                    setFilters({ ...filters, DateSold: e.target.value })
                  }
                />
              </th>

              <th className="filter-cell">
                <input
                  type="text"
                  value={filters.PriceSold}
                  className="filter-input"
                  onChange={(e) =>
                    setFilters({ ...filters, PriceSold: e.target.value })
                  }
                />
              </th>

              <th className="filter-cell">
                <input
                  type="text"
                  value={filters.SoldToCurrentChange}
                  className="filter-input"
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      SoldToCurrentChange: e.target.value,
                    })
                  }
                />
              </th>

              <th className="filter-cell"></th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((stock, index) => (
              <tr key={index}>
                <td>{stock.Ticker}</td>

                <td>{stock.CompanyName}</td>

                <td>{formatCurrency(stock.CurrentPrice)}</td>

                <td>{formatCurrency(stock.FiftyTwoWeekHigh)}</td>

                <td>{formatCurrency(stock.FiftyTwoWeekLow)}</td>

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

                <td>{stock.DateSold || "N/A"}</td>

                <td>{formatCurrency(stock.PriceSold)}</td>

                <td
                  style={{
                    backgroundColor: getPriceChangeColor(
                      stock.SoldToCurrentChange,
                    ),
                    color: usePriceChangeWhiteText(stock.SoldToCurrentChange),
                  }}
                >
                  {stock.SoldToCurrentChange || "N/A"}
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
