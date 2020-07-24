import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth0 } from '@auth0/auth0-react';

import Loading from './Loading';

export default function Nav() {
  const { pathname } = useRouter();
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <span className="navbar-brand">@auth0/auth0-react</span>
      <div className="collapse navbar-collapse">
        <div className="navbar-nav">
          <Link href="/">
            <a className={`nav-item nav-link${pathname === '/' ? ' active' : ''}`}>Home</a>
          </Link>
          <Link href="/users">
            <a className={`nav-item nav-link${pathname === '/users' ? ' active' : ''}`}>Users</a>
          </Link>
        </div>
      </div>

      <div>
        {isAuthenticated ? (
          <button
            className="btn btn-outline-secondary"
            id="logout"
            onClick={() => logout({ returnTo: window.location.origin })}
          >
            logout
          </button>
        ) : (
          <button className="btn btn-outline-success" id="login" onClick={() => loginWithRedirect()}>
            login
          </button>
        )}
      </div>
    </nav>
  );
}
