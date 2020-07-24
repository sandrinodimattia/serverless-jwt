import React from 'react';

export default function Error({ message }) {
  return (
    <div className="alert alert-danger" role="alert">
      Oops... {message}
    </div>
  );
}
