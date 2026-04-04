'use client';

import styles from './TerminosModal.module.css';

interface TerminosModalProps {
  onClose: () => void;
}

const secciones = [
  {
    titulo: '1. Protección de Datos Personales (LFPDPPP)',
    texto: 'De conformidad con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), Glamstock garantiza que el tratamiento de sus datos (nombre, email y contraseña) se realizará de manera legítima, controlada e informada.',
  },
  {
    titulo: '2. Registro y Control de Inventarios, Artículo 28 del Código Fiscal de la Federación (Fracciones I y III)',
    texto: 'Glamstock funciona como una herramienta de gestión integral. Mantiene un control de inventarios y métodos de valuación precisos, almacena la información en medios electrónicos procesables, asegurando que los registros de activos sean veraces, disponibles y cumplan con los estándares de contabilidad electrónica exigidos por las autoridades fiscales.',
  },
  {
    titulo: '3. Responsabilidad del Usuario',
    texto: 'GLAMSTOCK es una plataforma de gestión de inventario. El usuario es responsable de la información que registre en el sistema, incluyendo productos, ventas y ajustes de stock.',
  },
  {
    titulo: '4. Propiedad Intelectual',
    texto: 'Todo el contenido de GLAMSTOCK, incluyendo diseño, código y marca, es propiedad exclusiva de GLAMSTOCK. Queda prohibida su reproducción sin autorización.',
  },
];

export default function TerminosModal({ onClose }: TerminosModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>

        <div className={styles.header}>
          <span className={styles.infoIcon}>ⓘ</span>
          <h2 className={styles.titulo}>Términos y Condiciones de GLAMSTOCK</h2>
        </div>

        <div className={styles.contenido}>
          {secciones.map((s, i) => (
            <div key={i} className={styles.seccion}>
              <h3 className={styles.seccionTitulo}>{s.titulo}</h3>
              <p className={styles.seccionTexto}>{s.texto}</p>
            </div>
          ))}
        </div>

        <button className={styles.cerrarBtn} onClick={onClose}>Aceptar y cerrar</button>

      </div>
    </div>
  );
}