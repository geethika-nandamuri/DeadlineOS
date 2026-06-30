import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from './AuthLayout';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const { resetPassword, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPw, setShowPw] = useState(false);
  const [done, setDone]     = useState(false);
  const [serverErr, setServerErr] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch('password');

  const onSubmit = async ({ password: pw }) => {
    setServerErr('');
    if (!token) {
      setServerErr('Invalid or missing reset token. Please request a new link.');
      return;
    }
    try {
      const data = await resetPassword(token, pw);
      setDone(true);
      // Auto-redirect after 2s
      setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
    } catch (err) {
      setServerErr(err.message || 'Failed to reset password. The link may have expired.');
    }
  };

  if (done) {
    return (
      <AuthLayout title="Password updated!" subtitle="">
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-500" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
            Your password has been reset. Redirecting you to the dashboard…
          </p>
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </div>
      </AuthLayout>
    );
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="">
        <div className="text-center py-4">
          <p className="text-sm text-slate-500 mb-4">This reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn-primary text-sm py-2 px-5 inline-flex">
            Request a new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password for your account">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {serverErr && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl text-sm text-red-600 dark:text-red-400">
            {serverErr}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">New password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
              className="form-input pr-10"
              {...register('password', {
                required: 'Password is required.',
                minLength: { value: 6, message: 'At least 6 characters.' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Confirm new password</label>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            className="form-input"
            {...register('confirm', {
              required: 'Please confirm your password.',
              validate: v => v === password || 'Passwords do not match.',
            })}
          />
          {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-2.5 mt-1">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Updating…
            </span>
          ) : 'Set new password'}
        </button>
      </form>
    </AuthLayout>
  );
}
