import React from 'react';
import styles from './FormField.module.css';

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  icon?: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label, id, type = 'text', value, onChange, error, placeholder = '', icon,
}) => {
  return (
    <div className={styles.formGroup}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.inputWrapper}>
        <input
          type={type}
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
        />
        {icon && <span className={styles.icon}>{icon}</span>}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};

export default FormField;