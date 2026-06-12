import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Header from "./components/header";
import SearchableSelect from "./components/SearchableSelect";

// Columns filtered by exact-match searchable dropdowns.
const facetColumns = ["Ticker", "CompanyName", "Sector", "Industry"];

function App() {
  const [allStockData, setAllStockData] = useState([]);
  const [starredTickers, setStarredTickers] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [newTicker, setNewTicker] = useState("");
  const [adding, setAdding] = useState(false);
  const [addStatus, setAddStatus] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  const [filters, setFilters] = useState({
    Ticker: "",
    CompanyName: "",
    Sector: "",
    Industry: "",
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
        const [stocksRes, starredRes] = await Promise.all([
          axios.get("http://localhost:5001/api/stocks"),
          axios.get("http://localhost:5001/api/starred-tickers"),
        ]);

        setAllStockData(stocksRes.data);
        setStarredTickers(new Set(starredRes.data));
      } catch (err) {
        setError("Error fetching stock data");
      }

      setLoading(false);
    };

    fetchAll();
  }, []);

  const toggleStar = async (ticker) => {
    // Optimistic update so the UI flips immediately.
    const previous = new Set(starredTickers);
    const next = new Set(starredTickers);

    if (next.has(ticker)) {
      next.delete(ticker);
    } else {
      next.add(ticker);
    }

    setStarredTickers(next);

    try {
      await axios.post(`http://localhost:5001/api/star/${ticker}`);
    } catch (err) {
      // Revert if the backend write failed.
      setStarredTickers(previous);
    }
  };

  const handleAddTicker = async () => {
    const symbol = newTicker.trim().toUpperCase();
    if (!symbol || adding) return;

    setAdding(true);
    setAddStatus(null);

    try {
      const res = await axios.post(
        `http://localhost:5001/api/stocks/${symbol}`,
      );
      setAllStockData((prev) => [...prev, res.data]);
      setNewTicker("");
      setAddStatus(`Added ${symbol}`);
    } catch (err) {
      setAddStatus(err.response?.data?.detail || `Could not add ${symbol}`);
    }

    setAdding(false);
  };

  // True when a stock matches every active dropdown filter, optionally
  // ignoring one column. Ignoring lets each dropdown's option list
  // cascade off the OTHER selections without filtering itself away.
  const matchesFacets = (stock, excludeKey = null) => {
    return facetColumns.every((key) => {
      if (key === excludeKey || !filters[key]) return true;
      return stock[key] === filters[key];
    });
  };

  const facetOptions = useMemo(() => {
    const options = {};

    for (const key of facetColumns) {
      const values = new Set();

      for (const stock of allStockData) {
        if (!matchesFacets(stock, key)) continue;
        if (stock[key]) values.add(String(stock[key]));
      }

      options[key] = [...values].sort();
    }

    return options;
  }, [allStockData, filters]);

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
    return [...allStockData].sort((a, b) => {
      if (!sortConfig.key) return 0;

      if (sortConfig.key === "Starred") {
        // Starred rows sort as 1, unstarred as 0.
        return compareNullableValues(
          starredTickers.has(a.Ticker) ? 1 : 0,
          starredTickers.has(b.Ticker) ? 1 : 0,
        );
      }

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
  }, [allStockData, sortConfig, starredTickers]);

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
      // Exact-match dropdown filters.
      if (!matchesFacets(stock)) return false;

      // Substring filters.
      return (
        String(stock.DateSold || "").includes(filters.DateSold) &&
        String(stock.PriceSold || "").includes(filters.PriceSold) &&
        String(stock.SoldToCurrentChange || "").includes(
          filters.SoldToCurrentChange,
        )
      );
    });
  }, [sortedData, filters]);

  const setFacetFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

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

      <div id="add-ticker">
        <input
          type="text"
          className="add-ticker-input"
          placeholder="Add ticker (e.g. NVDA)"
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTicker()}
        />
        <button
          type="button"
          className="add-ticker-button"
          onClick={handleAddTicker}
          disabled={adding || !newTicker.trim()}
        >
          {adding ? "Adding..." : "Add ticker"}
        </button>
        {addStatus && <span className="add-ticker-status">{addStatus}</span>}
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
                onClick={() => requestSort("Starred")}
                style={{ cursor: "pointer" }}
                title="Sort by starred"
              >
                ★{getSortArrow("Starred")}
              </th>

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
                onClick={() => requestSort("Sector")}
                style={{ cursor: "pointer" }}
              >
                Sector{getSortArrow("Sector")}
              </th>

              <th
                onClick={() => requestSort("Industry")}
                style={{ cursor: "pointer" }}
              >
                Industry{getSortArrow("Industry")}
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
              <th className="filter-cell"></th>

              <th className="filter-cell">
                <SearchableSelect
                  value={filters.Ticker}
                  options={facetOptions.Ticker}
                  onChange={(value) => setFacetFilter("Ticker", value)}
                  placeholder="All"
                />
              </th>

              <th className="filter-cell">
                <SearchableSelect
                  value={filters.CompanyName}
                  options={facetOptions.CompanyName}
                  onChange={(value) => setFacetFilter("CompanyName", value)}
                  placeholder="All"
                />
              </th>

              <th className="filter-cell">
                <SearchableSelect
                  value={filters.Sector}
                  options={facetOptions.Sector}
                  onChange={(value) => setFacetFilter("Sector", value)}
                  placeholder="All"
                />
              </th>

              <th className="filter-cell">
                <SearchableSelect
                  value={filters.Industry}
                  options={facetOptions.Industry}
                  onChange={(value) => setFacetFilter("Industry", value)}
                  placeholder="All"
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
            </tr>
          </thead>

          <tbody>
            {filteredData.map((stock, index) => (
              <tr key={stock.Ticker || index}>
                <td className="star-cell">
                  <button
                    type="button"
                    className={
                      starredTickers.has(stock.Ticker)
                        ? "star-button starred"
                        : "star-button"
                    }
                    onClick={() => toggleStar(stock.Ticker)}
                    aria-label={
                      starredTickers.has(stock.Ticker)
                        ? `Unstar ${stock.Ticker}`
                        : `Star ${stock.Ticker}`
                    }
                  >
                    {starredTickers.has(stock.Ticker) ? "★" : "☆"}
                  </button>
                </td>

                <td>{stock.Ticker}</td>

                <td>{stock.CompanyName}</td>

                <td>{stock.Sector || "N/A"}</td>

                <td>{stock.Industry || "N/A"}</td>

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
