import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = ({ onSwitchToLogin }) => {
  const [accessCode, setAccessCode] = useState('');
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleAccessCodeSubmit = (e) => {
    e.preventDefault();
    setError('');
    const correctCode = process.env.REACT_APP_REGISTER_ACCESS_CODE;
    if (accessCode === correctCode) {
      setIsAccessGranted(true);
    } else {
      setError('Invalid access code');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAccessGranted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Time Clock</h1>
          <h2>Registration Access</h2>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleAccessCodeSubmit}>
            <div className="auth-field">
              <label htmlFor="accessCode">Access Code</label>
              <input
                type="password"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                required
                placeholder="Enter access code"
              />
            </div>

            <button type="submit" className="auth-button">
              Continue
            </button>
          </form>

          <p className="auth-switch">
            <button type="button" onClick={onSwitchToLogin}>
              Back to Sign In
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Time Clock</h1>
        <h2>Create Account</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          <button type="button" onClick={onSwitchToLogin}>
            Back to Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
