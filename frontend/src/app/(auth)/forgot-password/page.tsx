'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Link from 'next/link';

// Validation schema
const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
});

type ForgotPasswordFormData = yup.InferType<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Simulate API call for forgot password
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setIsEmailSent(true);
      setSubmitMessage(`Password reset instructions have been sent to ${data.email}`);
    } catch (error) {
      console.error('Forgot password error:', error);
      setSubmitMessage('Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <h1>Check Your Email</h1>
            <p>We&apos;ve sent password reset instructions to your email address</p>
          </div>
          
          <div className="email-sent-content">
            <div className="email-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            
            <div className="email-sent-text">
              <p className="success-title">Email sent successfully!</p>
              <p className="success-description">
                Please check your inbox and follow the instructions to reset your password.
              </p>
              <p className="success-note">
                Didn&apos;t receive the email? Check your spam folder or try again.
              </p>
            </div>

            <button
              onClick={() => {
                setIsEmailSent(false);
                setSubmitMessage('');
              }}
              className="resend-button"
            >
              Send Another Email
            </button>
          </div>

          <div className="forgot-password-footer">
            <Link href="/login" className="back-link">
              <span className="back-arrow">←</span>
              Back to Sign In
            </Link>
          </div>
        </div>

        <style jsx>{`
          .forgot-password-container {
            min-height: 100vh;
            background: #0a0a0a;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          }

          .forgot-password-card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 40px;
            width: 100%;
            max-width: 450px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }

          .forgot-password-header {
            text-align: center;
            margin-bottom: 32px;
          }

          .forgot-password-header h1 {
            color: #ffffff;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .forgot-password-header p {
            color: #888;
            font-size: 16px;
          }

          .email-sent-content {
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 24px;
          }

          .email-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto;
            background: rgba(34, 197, 94, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #22c55e;
          }

          .email-sent-text {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .success-title {
            color: #ffffff;
            font-size: 18px;
            font-weight: 600;
          }

          .success-description {
            color: #888;
            font-size: 14px;
            line-height: 1.5;
          }

          .success-note {
            color: #666;
            font-size: 12px;
          }

          .resend-button {
            background: transparent;
            border: 1px solid #444;
            color: #ffffff;
            border-radius: 8px;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .resend-button:hover {
            background: #2a2a2a;
            border-color: #555;
          }

          .forgot-password-footer {
            text-align: center;
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #333;
          }

          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            color: #888;
            text-decoration: none;
            font-size: 14px;
            transition: color 0.2s ease;
          }

          .back-link:hover {
            color: #ffffff;
          }

          .back-arrow {
            font-size: 16px;
          }

          @media (max-width: 480px) {
            .forgot-password-card {
              padding: 24px;
              margin: 10px;
            }

            .forgot-password-header h1 {
              font-size: 24px;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="forgot-password-header">
          <h1>Forgot Password?</h1>
          <p>Enter your email address and we&apos;ll send you instructions to reset your password</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="forgot-password-form">
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

          <button type="submit" disabled={isSubmitting} className="submit-button">
            {isSubmitting ? 'Sending Instructions...' : 'Send Reset Instructions'}
          </button>

          {submitMessage && !isEmailSent && (
            <div className="submit-message error">
              {submitMessage}
            </div>
          )}
        </form>

        <div className="forgot-password-footer">
          <Link href="/login">
            <p className="back-link">Back to Sign In</p>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .forgot-password-container {
          min-height: 100vh;
          background: #0a0a0a;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .forgot-password-card {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 40px;
          width: 100%;
          max-width: 450px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .forgot-password-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .forgot-password-header h1 {
          color: #ffffff;
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .forgot-password-header p {
          color: #888;
          font-size: 16px;
          line-height: 1.5;
        }

        .forgot-password-form {
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

        .submit-message.error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .forgot-password-footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #333;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #888;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
        }

        .back-link:hover {
          color: #ffffff;
        }

        .back-arrow {
          font-size: 16px;
        }

        @media (max-width: 480px) {
          .forgot-password-card {
            padding: 24px;
            margin: 10px;
          }

          .forgot-password-header h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
