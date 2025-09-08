'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// Validation schema
const signupSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

type SignupFormData = yup.InferType<typeof signupSchema>;

export default function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmitMessage(result.message || 'Account created successfully!');

        // Auto-login user after successful signup if token is provided
        if (result.token) {
          try {
            login(
              result.token,
              result.user || { id: '', name: data.name, email: data.email }, // Use user data from backend or form data
              result.expiresIn, // Token expiration in seconds from backend
              result.refreshToken // Optional refresh token
            );

            // Redirect to dashboard or home page after successful signup and login
            // window.location.href = '/dashboard';
          } catch (error) {
            console.error('Failed to store authentication token:', error);
            setSubmitMessage(
              'Account created successfully but failed to save session. Please log in manually.'
            );
            return;
          }
        } else {
          // If no token provided, just show success message (user needs to login manually)
          reset();
        }
      } else {
        setSubmitMessage(
          result.message || 'Failed to create account. Please try again.'
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      setSubmitMessage(
        'Network error. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1>Create Account</h1>
          <p>Join us today and start your journey</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="signup-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={errors.name ? 'error' : ''}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <span className="error-message">{errors.name.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <span className="error-message">{errors.email.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className={errors.password ? 'error' : ''}
              placeholder="Create a strong password"
            />
            {errors.password && (
              <span className="error-message">{errors.password.message}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <span className="error-message">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>

          {submitMessage && (
            <div
              className={`submit-message ${submitMessage.includes('successfully') ? 'success' : 'error'}`}
            >
              {submitMessage}
            </div>
          )}
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="login-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <style jsx>{`
        .signup-container {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family:
            -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, sans-serif;
        }

        .signup-card {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 40px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .signup-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .signup-header h1 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .signup-header p {
          color: #888;
          font-size: 16px;
        }

        .signup-form {
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

        .signup-footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #333;
        }

        .signup-footer p {
          color: #888;
          font-size: 14px;
        }

        .login-link {
          color: #ffffff;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .login-link:hover {
          color: #f0f0f0;
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .signup-card {
            padding: 24px;
            margin: 10px;
          }

          .signup-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
