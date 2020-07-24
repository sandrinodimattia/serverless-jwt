import React from 'react';
import Header from './header';

export default ({ children }) => {
  return (
    <div>
      <Header />
      <div className="pt-5">{children}</div>
    </div>
  );
};
