import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [categories, setCategories] = useState([
    { value: 'all', label: 'All' },
    { value: 'oil', label: 'Oil' },
    { value: 'tech', label: 'Tech' },
    { value: 'finance', label: 'Finance' },
    { value: 'chips', label: 'Chips' },
    { value: 'bitcoin', label: 'Bitcoin' },
    { value: 'ai', label: 'AI' },
    { value: 'energy', label: 'Energy' },
    { value: 'airlines', label: 'Airlines' },
    { value: 'travel', label: 'Travel' },
    { value: 'hotels', label: 'Hotels' },
    { value: 'shipping', label: 'Shipping' }
  ]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Helper function to get the background color based on percentage change
  const getBackgroundColor = val => {
    if (val === 'N/A' || isNaN(parseFloat(val))) {
      return ''; // No color for 'N/A'
    }

    // Remove "%" and parse the value as a float
    const percentage = parseFloat(val.replace('%', ''));

    if (percentage <= -50) {
      return '#3E7C59'; // -50% or less (e.g., -55%)
    } else if (percentage < -40 && percentage >= -49) {
      return '#3E6F6B'; // Between -49% and -40% (e.g., -45%)
    } else if (percentage < -30 && percentage >= -39) {
      return '#5D8679'; // Between -39% and -30% (e.g., -35%)
    } else if (percentage < -20 && percentage >= -29) {
      return '#317A86'; // Between -29% and -20% (e.g., -25%)
    } else if (percentage < -10 && percentage >= -19) {
      return '#61727C'; // Between -19% and -10% (e.g., -15%)
    } else {
      return ''; // No color for other values (e.g., > -10% or positive)
    }
  };

  const shouldUseWhiteText = val => {
    // If a background color is applied, set the text to white
    return getBackgroundColor(val) !== '' ? '#F2EFE9' : '';
  };

  return (
    <div>
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
        <table border='1' cellPadding='10' cellSpacing='0'>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Company Name</th>
              <th>Current Price</th>
              <th>52 Week High</th>
              <th>52 Week Low</th>
              <th>Market Cap</th>
              <th>Change</th>
              <th>% Change from 52 Week High</th>
            </tr>
          </thead>
          <tbody>
            {stockData.map((stock, index) => (
              <tr key={index}>
                <td>{stock.Ticker}</td>
                <td>{stock.CompanyName}</td>
                <td>${stock.CurrentPrice.toFixed(2)}</td>
                <td>${stock.FiftyTwoWeekHigh}</td>
                <td>${stock.FiftyTwoWeekLow}</td>
                <td>${(stock.MarketCap / 1e9).toFixed(2)}B</td>
                <td>{stock.CHANGE}</td>
                <td
                  style={{
                    backgroundColor: getBackgroundColor(
                      stock.HighToCurrentChange
                    ),
                    color: shouldUseWhiteText(stock.HighToCurrentChange) // Conditionally set text color to white
                  }}
                >
                  {stock.HighToCurrentChange}
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
