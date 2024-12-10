import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from './components/header';

function App() {
  const [categories, setCategories] = useState([
    { value: 'all', label: 'All' },
    { value: 'oil', label: 'Oil' },
    { value: 'tech', label: 'Tech' },
    { value: 'finance', label: 'Finance' },
    { value: 'chips', label: 'Chips' },
    { value: 'bitcoin', label: 'Bitcoin' },
    { value: 'etf', label: 'ETF' },
    { value: 'ai', label: 'AI' },
    { value: 'energy', label: 'Energy' },
    { value: 'airlines', label: 'Airlines' },
    { value: 'travel', label: 'Travel' },
    { value: 'hotels', label: 'Hotels' },
    { value: 'shipping', label: 'Shipping' },
    { value: 'builders', label: 'Builders' },
    { value: 'materials', label: 'Materials' }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });
  const [filters, setFilters] = useState({
    Ticker: '',
    CompanyName: '',
    CurrentPrice: '',
    FiftyTwoWeekHigh: '',
    FiftyTwoWeekLow: '',
    MarketCap: '',
    CHANGE: '',
    HighToCurrentChange: ''
  });

  // Fetch stock data from the backend when the category changes
  useEffect(() => {
    const fetchStockData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `http://localhost:5001/api/stocks/${selectedCategory}`
        );
        setStockData(response.data);
      } catch (err) {
        setError('Error fetching stock data');
      }

      setLoading(false);
    };

    fetchStockData();
  }, [selectedCategory]);

  const sortedData = [...stockData].sort((a, b) => {
    if (sortConfig.key) {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Convert percentage string to number if necessary
      if (
        sortConfig.key === 'HighToCurrentChange' ||
        sortConfig.key === 'CHANGE'
      ) {
        aValue = parseFloat(aValue.replace('%', '')) || 0;
        bValue = parseFloat(bValue.replace('%', '')) || 0;
      }

      if (sortConfig.direction === 'ascending') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    }
    return 0;
  });

  const requestSort = key => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = sortedData.filter(stock => {
    return (
      (stock.Ticker?.toLowerCase() || '').includes(
        filters.Ticker.toLowerCase()
      ) &&
      (stock.CompanyName?.toLowerCase() || '').includes(
        filters.CompanyName.toLowerCase()
      ) &&
      String(stock.CurrentPrice || '').includes(filters.CurrentPrice) &&
      String(stock.FiftyTwoWeekHigh || '').includes(filters.FiftyTwoWeekHigh) &&
      String(stock.FiftyTwoWeekLow || '').includes(filters.FiftyTwoWeekLow) &&
      String(stock.MarketCap || '').includes(filters.MarketCap) &&
      String(stock.CHANGE || '').includes(filters.CHANGE) &&
      String(stock.HighToCurrentChange || '').includes(
        filters.HighToCurrentChange
      )
    );
  });

  // Helper function to get the background color based on percentage change
  const getBackgroundColor = val => {
    if (val === 'N/A' || isNaN(parseFloat(val))) {
      return ''; // No color for 'N/A'
    }

    // Remove "%" and parse the value as a float
    const percentage = parseFloat(val.replace('%', ''));

    if (percentage <= -50) {
      return 'rgba(187, 44, 62, 1)'; // Fully opaque
    } else if (percentage < -40 && percentage >= -49) {
      return 'rgba(187, 44, 62, 0.9)'; // 90% opacity
    } else if (percentage < -30 && percentage >= -39) {
      return 'rgba(187, 44, 62, 0.8)'; // 80% opacity
    } else if (percentage < -20 && percentage >= -29) {
      return 'rgba(187, 44, 62, 0.7)'; // 70% opacity
    } else if (percentage < -10 && percentage >= -19) {
      return 'rgba(187, 44, 62, 0.6)'; // 60% opacity
    } else {
      return ''; // No color for other values (e.g., > -10% or positive)
    }
  };

  const shouldUseWhiteText = val => {
    // If a background color is applied, set the text to white
    return getBackgroundColor(val) !== '' ? '#F2EFE9' : '';
  };

  const getPriceChangeColor = val => {
    if (val === 'N/A' || isNaN(parseFloat(val))) {
      return ''; // No color for 'N/A'
    }

    // Remove "%" and parse the value as a float
    const percentage = parseFloat(val.replace('%', ''));

    if (percentage < 0) {
      return '#BB2C3E'; //red
    } else if (percentage > 0.1) {
      return '#3E7C59'; // green
    } else {
      return ''; // No color
    }
  };

  const usePriceChangeWhiteText = val => {
    // If a background color is applied, set the text to white
    return getPriceChangeColor(val) !== '' ? '#F2EFE9' : '';
  };

  return (
    <div>
      <Header />
      <h1 className='header'>Stock Data</h1>

      {/* Dropdown for selecting category */}
      <div id='select-category'>
        <label>Select Category: </label>
        <select
          id='category-select'
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
        >
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading and error handling */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <table className='table-bordered' cellPadding='10' cellSpacing='0'>
          <thead>
            <tr>
              <th onClick={() => requestSort('Ticker')}>Ticker</th>
              <th onClick={() => requestSort('CompanyName')}>Company Name</th>
              <th onClick={() => requestSort('CurrentPrice')}>Current Price</th>
              <th onClick={() => requestSort('FiftyTwoWeekHigh')}>
                52 Week High
              </th>
              <th onClick={() => requestSort('FiftyTwoWeekLow')}>
                52 Week Low
              </th>
              <th onClick={() => requestSort('MarketCap')}>Market Cap</th>
              <th onClick={() => requestSort('CHANGE')}>Change</th>
              <th onClick={() => requestSort('HighToCurrentChange')}>
                % Change from 52 Week High
              </th>
              <th onClick={() => requestSort('EarningsDate')}>Earnings Date</th>
            </tr>
            <tr className='filter-row'>
              <th className='filter-cell'>
                <input
                  type='text'
                  value={filters.Ticker}
                  className='filter-input'
                  onChange={e =>
                    setFilters({ ...filters, Ticker: e.target.value })
                  }
                />
              </th>
              <th className='filter-cell'>
                <input
                  type='text'
                  value={filters.CompanyName}
                  className='filter-input'
                  onChange={e =>
                    setFilters({ ...filters, CompanyName: e.target.value })
                  }
                />
              </th>
              <th className='filter-cell'></th>
              <th className='filter-cell'></th>
              <th className='filter-cell'></th>
              <th className='filter-cell'></th>
              <th className='filter-cell'></th>
              <th className='filter-cell'></th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map((stock, index) => (
              <tr key={index}>
                <td>{stock.Ticker}</td>
                <td>{stock.CompanyName}</td>
                <td>
                  ${stock.CurrentPrice ? stock.CurrentPrice.toFixed(2) : 'N/A'}
                </td>

                <td>${stock.FiftyTwoWeekHigh}</td>
                <td>${stock.FiftyTwoWeekLow}</td>
                <td>
                  $
                  {stock.MarketCap ? (stock.MarketCap / 1e9).toFixed(2) : 'N/A'}
                  B
                </td>

                <td
                  style={{
                    backgroundColor: getPriceChangeColor(stock.CHANGE),
                    color: usePriceChangeWhiteText(stock.CHANGE)
                  }}
                >
                  {stock.CHANGE}
                </td>
                <td
                  style={{
                    backgroundColor: getBackgroundColor(
                      stock.HighToCurrentChange
                    ),
                    color: shouldUseWhiteText(stock.HighToCurrentChange)
                  }}
                >
                  {stock.HighToCurrentChange}
                </td>
                <td>
                  {Array.isArray(stock.EarningsDate)
                    ? stock.EarningsDate.join(', ')
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
