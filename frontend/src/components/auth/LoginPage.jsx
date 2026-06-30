import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from './AuthLayout';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [serverErr, setServerErr] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setServerErr('');
    try {
      await login(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerErr(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {serverErr && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl text-sm text-red-600 dark:text-red-400">
            {serverErr}
          </div>
        )}

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Email</label>
          <input
            type="email"
            placeholder="you@email.com"
            autoComplete="email"
            className="form-input"
            {...register('email', {
              required: 'Email is required.',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email.' },
            })}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              className="form-input pr-10"
              {...register('password', { required: 'Password is required.' })}
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

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-2.5 mt-1">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </span>
          ) : (
            <span className="flex items-center gap-2">Sign in <ArrowRight className="w-4 h-4" /></span>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
      </p>
    </AuthLayout>
  );
}
