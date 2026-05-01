'use client';

import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AuthButton from '@/components/auth/AuthButton';
import AuthCard from '@/components/auth/AuthCard';
import AuthField from '@/components/auth/AuthField';

interface LoginApiResponse {
  access_token?: string;
  user?: unknown;
  detail?: string;
  error?: string;
}

const copy = {
  title: '\uB85C\uADF8\uC778',
  subtitle: '\uACC4\uC815 \uC815\uBCF4\uB97C \uC785\uB825\uD558\uC5EC \uD130\uBBF8\uB110\uC5D0 \uC811\uC18D\uD558\uC138\uC694.',
  emailLabel: '\uC544\uC774\uB514',
  passwordLabel: '\uBE44\uBC00\uBC88\uD638',
  passwordPlaceholder: '\uBE44\uBC00\uBC88\uD638 \uC785\uB825',
  remember: '\uB85C\uADF8\uC778 \uC0C1\uD0DC \uC720\uC9C0',
  loading: '\uC811\uC18D \uC911...',
  submit: '\uD130\uBBF8\uB110 \uC811\uC18D\uD558\uAE30',
  signup: '\uC2E0\uADDC \uD68C\uC6D0\uAC00\uC785',
  findAccount: '\uC544\uC774\uB514/\uBE44\uBC00\uBC88\uD638 \uCC3E\uAE30',
  showPassword: '\uBE44\uBC00\uBC88\uD638 \uBCF4\uAE30',
  hidePassword: '\uBE44\uBC00\uBC88\uD638 \uC228\uAE30\uAE30',
  invalidResponse: '\uB85C\uADF8\uC778 \uC751\uB2F5\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
  loginFailed: '\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.',
  loginError: '\uB85C\uADF8\uC778 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4.',
  findPending: '\uC544\uC774\uB514/\uBE44\uBC00\uBC88\uD638 \uCC3E\uAE30\uB294 \uC900\uBE44 \uC911\uC785\uB2C8\uB2E4.',
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await response.json()) as LoginApiResponse;

      if (!response.ok) {
        throw new Error(data.detail || data.error || copy.loginFailed);
      }

      if (!data.access_token || !data.user) {
        throw new Error(copy.invalidResponse);
      }

      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('remember_login', remember ? 'true' : 'false');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.loginError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard>
      <div className="mb-7">
        <h2 className="text-xl font-black text-white">{copy.title}</h2>
        <p className="mt-2 text-sm font-semibold text-white/42">{copy.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label={copy.emailLabel}
          icon={<Mail size={18} />}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          autoComplete="email"
          required
        />

        <AuthField
          label={copy.passwordLabel}
          icon={<Lock size={18} />}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={copy.passwordPlaceholder}
          autoComplete="current-password"
          required
          rightSlot={
            <button
              type="button"
              className="grid h-full w-11 place-items-center text-white/38 hover:text-[#00FF41]"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? copy.hidePassword : copy.showPassword}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          }
        />

        <label className="flex items-center gap-3 text-sm font-bold text-white/52">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 appearance-none border border-white/12 bg-black/75 checked:border-[#00FF41] checked:bg-[#00FF41]"
          />
          {copy.remember}
        </label>

        {error && (
          <p className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
            {error}
          </p>
        )}

        <AuthButton type="submit" disabled={loading}>
          {loading ? copy.loading : copy.submit}
        </AuthButton>
      </form>

      <div className="mt-8 flex items-center justify-between gap-4 text-sm font-extrabold">
        <Link href="/signup" className="text-[#00FF41] underline decoration-[#00FF41]/45 underline-offset-4">
          {copy.signup}
        </Link>
        <button
          type="button"
          className="text-right text-white/50 hover:text-[#00FF41]"
          onClick={() => setError(copy.findPending)}
        >
          {copy.findAccount}
        </button>
      </div>
    </AuthCard>
  );
}
