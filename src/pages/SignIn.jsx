import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';


export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:3002/login', {
        email,
        password,
      });

      if (response.status === 200) {
        alert('Login successful!');
        navigate('/home', {
          state: {
            email: response.data.user.email,
            // or pass entire user: user: response.data.user
          }
        });
      }

    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('An error occurred during login.');
      }
    }
  };

  return (
    <div style={styles.container}>
      <h2>Sign In</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
        <button type="submit" style={styles.button}>
          Sign In
        </button>
        <p style={styles.link} onClick={() => navigate('/signup')}>
          Don't have an account? Sign Up
        </p>
      </form>
      <Link to="/android-storage">Check Android Storage</Link>

      <Link to="/versiv-connectivity">Versiv Connectivity</Link>


    </div>
  );
}

const styles = {
  container: {
    marginTop: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  form: {
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    marginBottom: '15px',
    padding: '10px',
    fontSize: '16px',
  },
  button: {
    padding: '10px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  link: {
    marginTop: '10px',
    color: 'blue',
    textDecoration: 'underline',
    cursor: 'pointer',
    textAlign: 'center',
  },
};
