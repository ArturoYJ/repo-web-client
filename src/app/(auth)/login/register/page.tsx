'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Eye, EyeOff } from 'lucide-react';
import FormField from '@/components/forms/FormField';
import ErrorMessage from '@/components/forms/ErrorMessage';
import TerminosModal from '@/components/ui/TerminosModal';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTerminos, setShowTerminos] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: '' }));
    setGeneralError('');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!formData.email) newErrors.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Formato de correo inválido';
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre: formData.name, email: formData.email, password: formData.password, rol: 'GERENTE' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al crear la cuenta');
      router.push('/dashboard');
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Ocurrió un error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.logo}>GLAMSTOCK</h1>
      <div className={styles.card}>
        <h1 className={styles.title}>¡Regístrate!</h1>
        <p className={styles.subtitle}>Ingresa tus datos para crear tu cuenta</p>

        {generalError && <ErrorMessage message={generalError} />}

        <form onSubmit={handleSubmit}>
          <div className={styles.grid}>

            <FormField
              label="Nombre:"
              id="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              icon={<User size={18} />}
            />

            <FormField
              label="Email:"
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={<Mail size={18} />}
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

            <FormField
              label="Confirmar contraseña:"
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              icon={
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

          </div>

          <button type="submit" disabled={isLoading} className={styles.submitButton}>
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <Link href="/login" className={styles.login}>
            ¿Tienes cuenta? <span className={styles.loginLink}>Inicia sesión</span>
          </Link>
        </form>

        <div className={styles.term}>
          <span className={styles.termIcon}>ⓘ</span>
          <button type="button" className={styles.termLink} onClick={() => setShowTerminos(true)}>
            Ver Términos y Condiciones
          </button>
        </div>
      </div>
      {showTerminos && <TerminosModal onClose={() => setShowTerminos(false)} />}
    </div>
  );
}