import React from 'react';
import { withAuthenticationRequired } from '@auth0/auth0-react';

import { useApi } from '../hooks/use-api';
import Error from '../components/Error';
import Loading from '../components/Loading';

const Users = () => {
  const { loading, error, data: users = [] } = useApi(`/api/users`, {
    audience: process.env.NEXT_PUBLIC_AUDIENCE,
    scope: 'read:users'
  });

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Email</th>
        </tr>
      </thead>
      <tbody>
        {users.map(({ name, email }, i) => (
          <tr key={i}>
            <td>{name}</td>
            <td>{email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default withAuthenticationRequired(Users);
