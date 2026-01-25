import React from 'react';
import './FullPageWrapper.css';

const FullPageWrapper = ({ children, className = '' }) => {
  return (
    <div className={`full-page-wrapper ${className}`}>
      {children}
    </div>
  );
};

export default FullPageWrapper;