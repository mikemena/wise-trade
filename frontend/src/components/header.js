import React from 'react';
import './header.css';

const Header = () => {
  return (
    <header className='header'>
      <div className='header-content'>
        <img
          src={`${process.env.PUBLIC_URL}/assets/images/falcon-blue.svg`}
          alt='Logo'
          className='logo'
        />
        <h1 className='header-title'>Wise Trades</h1>
      </div>
    </header>
  );
};

export default Header;
