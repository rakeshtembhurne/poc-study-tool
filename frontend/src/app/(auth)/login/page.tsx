'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiUtils } from '@/lib/axios-config';
import { redirectAfterLogin } from '@/lib/redirect-utils';

// Validation schema
const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(1, 'Password is required'),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reset,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await apiUtils.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      });

      const result: any = response.data;

      if (result.success) {
        setSubmitMessage(result.message || 'Login successful!');
        
        // Use AuthContext login method with secure token storage
        if (result.token) {
          try {
            login(
              result.token,
              result.user || { id: '', name: '', email: data.email }, // Use user data from backend or fallback
              result.expiresIn, // Token expiration in seconds from backend
              result.refreshToken // Optional refresh token
            );
            
            // Redirect to intended page or dashboard after successful login
            setTimeout(() => {
              redirectAfterLogin('/dashboard');
            }, 1000); // Small delay to show success message
          } catch (error) {
            console.error('Failed to store authentication token:', error);
            setSubmitMessage('Login successful but failed to save session. Please try again.');
            return;
          }
        }
      } else {
        setSubmitMessage(result.message || 'Login failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle axios error responses
      if (error.response?.data?.message) {
        setSubmitMessage(error.response.data.message);
      } else if (error.code === 'ECONNABORTED') {
        setSubmitMessage('Request timeout. Please try again.');
      } else if (error.message === 'Network Error') {
        setSubmitMessage('Network error. Please check your connection and try again.');
      } else {
        setSubmitMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email address"
            />
            {errors.email && <span className="error-message">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className={errors.password ? 'error' : ''}
              placeholder="Enter your password"
            />
            {errors.password && <span className="error-message">{errors.password.message}</span>}
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password" className="forgot-password">
              Forgot password?
            </a>
          </div>

          <button type="submit" disabled={isSubmitting} className="submit-button">
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>

          {submitMessage && (
            <div className={`submit-message ${submitMessage.includes('successful') ? 'success' : 'error'}`}>
              {submitMessage}
            </div>
          )}
        </form>

        <div className="login-footer">
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="signup-link">
              Create one here
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .login-card {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-header h1 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .login-header p {
          color: #888;
          font-size: 16px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
        }

        .form-group input {
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 16px;
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .form-group input:focus {
          outline: none;
          border-color: #666;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        }

        .form-group input.error {
          border-color: #ff4444;
        }

        .form-group input::placeholder {
          color: #666;
        }

        .error-message {
          color: #ff4444;
          font-size: 13px;
          margin-top: 4px;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 8px 0;
        }

        .remember-me {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #888;
          font-size: 14px;
          cursor: pointer;
        }

        .remember-me input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #ffffff;
        }

        .forgot-password {
          color: #ffffff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .forgot-password:hover {
          color: #f0f0f0;
          text-decoration: underline;
        }

        .submit-button {
          background: #ffffff;
          color: #000000;
          border: none;
          border-radius: 8px;
          padding: 14px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 8px;
        }

        .submit-button:hover:not(:disabled) {
          background: #f0f0f0;
          transform: translateY(-1px);
        }

        .submit-button:disabled {
          background: #666;
          color: #999;
          cursor: not-allowed;
          transform: none;
        }

        .submit-message {
          text-align: center;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
          margin-top: 16px;
        }

        .submit-message.success {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .submit-message.error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .login-footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #333;
        }

        .login-footer p {
          color: #888;
          font-size: 14px;
        }

        .signup-link {
          color: #ffffff;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .signup-link:hover {
          color: #f0f0f0;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 24px;
            margin: 10px;
          }

          .login-header h1 {
            font-size: 24px;
          }

          .form-options {
            flex-direction: column;
            gap: 12px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
