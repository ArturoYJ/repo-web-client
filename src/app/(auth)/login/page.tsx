'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FormField from '@/components/forms/FormField';
import ErrorMessage from '@/components/forms/ErrorMessage';
import styles from './page.module.css';

const PASSWORD_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

type Step = 'credentials' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; otp?: string }>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateCredentials = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'El correo es obligatorio';
    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (!PASSWORD_REGEX.test(password)) {
      newErrors.password = 'La contraseña debe incluir al menos un carácter especial';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOtp = (): boolean => {
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setErrors({ otp: 'Ingresa el código de 6 dígitos enviado a tu correo' });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCredentials()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
      setStep('otp');
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOtp()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Código incorrecto');
      router.push('/dashboard');
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : 'Código incorrecto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.logo}>GLAMSTOCK</h1>

      <div className={styles.card}>
        <div className={styles.imageSection}>
          <img src="/img-1.jpg" alt="GlamStock Bag" className={styles.image} />
        </div>

        <div className={styles.formSection}>
          {step === 'credentials' ? (
            <>
              <h1 className={styles.title}>¡Bienvenido!</h1>
              <p className={styles.subtitle}>Ingresa tus datos para continuar</p>

              {generalError && <ErrorMessage message={generalError} />}

              <form onSubmit={handleCredentialsSubmit}>
                <FormField
                  label="Email:"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); setGeneralError(''); }}
                  error={errors.email}
                />
                <FormField
                  label="Contraseña:"
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); setGeneralError(''); }}
                  error={errors.password}
                />
                <button type="submit" disabled={isLoading} className={styles.submitButton}>
                  {isLoading ? 'Verificando...' : 'Continuar'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Verificación</h1>
              <p className={styles.subtitle}>
                Ingresa el código de 6 dígitos enviado a <strong>{email}</strong>
              </p>

              {generalError && <ErrorMessage message={generalError} />}

              <form onSubmit={handleOtpSubmit}>
                <FormField
                  label="Código de verificación:"
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}); setGeneralError(''); }}
                  error={errors.otp}
                />
                <button type="submit" disabled={isLoading} className={styles.submitButton}>
                  {isLoading ? 'Verificando...' : 'Ingresar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep('credentials'); setOtp(''); setGeneralError(''); }}
                  style={{ marginTop: '8px', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Volver
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}