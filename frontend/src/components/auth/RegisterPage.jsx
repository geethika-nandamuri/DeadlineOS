import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import AuthLayout from './AuthLayout';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [serverErr, setServerErr] = useState('');

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setServerErr('');
    try {
      await authRegister({ name: data.name, email: data.email, password: data.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerErr(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start planning smarter with AI">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {serverErr && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl text-sm text-red-600 dark:text-red-400">
            {serverErr}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Full name</label>
          <input
            type="text"
            placeholder="Alex Johnson"
            autoComplete="name"
            className="form-input"
            {...register('name', {
              required: 'Name is required.',
              minLength: { value: 2, message: 'At least 2 characters.' },
            })}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

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
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Password</label>
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

        {/* Confirm password */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1.5">Confirm password</label>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="new-password"
            className="form-input"
            {...register('confirmPassword', {
              required: 'Please confirm your password.',
              validate: v => v === password || 'Passwords do not match.',
            })}
          />
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center py-2.5 mt-1">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account…
            </span>
          ) : (
            <span className="flex items-center gap-2">Get started <ArrowRight className="w-4 h-4" /></span>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
