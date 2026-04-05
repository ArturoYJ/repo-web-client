'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FormField from '@/components/forms/FormField';
import { User, Mail, Eye, EyeOff } from 'lucide-react';
import ErrorMessage from '@/components/forms/ErrorMessage';
import styles from './page.module.css';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: undefined }));
    setGeneralError('');
  };

  const validate = (): boolean => {
    const newErrors: LoginFormErrors = {};
    if (!formData.email) newErrors.email = 'El correo es obligatorio';
    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setGeneralError('');

    try {
      const response = await fetch(`/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      router.push('/dashboard');
    } catch (error) {
      setGeneralError(
        error instanceof Error ? error.message : 'Credenciales inválidas'
      );
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
          <h1 className={styles.title}>¡Bienvenido!</h1>
          <p className={styles.subtitle}>Ingresa tus datos para continuar</p>

          {justRegistered && (
            <p className={styles.successMessage}>Cuenta creada con éxito. Inicia sesión para continuar.</p>
          )}
          {generalError && <ErrorMessage message={generalError} />}

          <form onSubmit={handleSubmit}>
            <FormField
              label="Email:"
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
            <FormField
              label="Contraseña:"
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <button type="submit" disabled={isLoading} className={styles.submitButton}>
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <Link href="/login/register" className={styles.new}>
              ¿No tienes cuenta? <span className={styles.newregister}>Regístrate</span>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}