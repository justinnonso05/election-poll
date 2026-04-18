'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Position {
  id: string;
  name: string;
  order: number;
}

interface FormMeta {
  association: { id: string; name: string; description: string | null; logoUrl: string | null };
  election: { id: string; title: string };
  positions: Position[];
}

const LEVELS = ['100', '200', '300', '400', '500'];

export default function CandidateRegistrationPage() {
  const [meta, setMeta] = useState<FormMeta | null>(null);
  const [metaError, setMetaError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    matricNumber: '',
    level: '',
    positionId: '',
  });

  useEffect(() => {
    fetch('/api/form/positions')
      .then((r) => r.json())
      .then((res) => {
        if (res.status === 'success') {
          setMeta(res.data);
        } else {
          setMetaError(res.message || 'Unable to load form. Please try again later.');
        }
      })
      .catch(() => setMetaError('Unable to load form. Please check your connection.'))
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'A valid email address is required.';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required.';
    if (!form.matricNumber.trim()) newErrors.matricNumber = 'Matric number is required.';
    if (!form.level) newErrors.level = 'Please select your level.';
    if (!form.positionId) newErrors.positionId = 'Please select the position you are aspiring for.';
    return newErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/form/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSubmitted(true);
      } else {
        setErrors({ _global: data.message || 'Submission failed. Please try again.' });
      }
    } catch {
      setErrors({ _global: 'Network error. Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.loadingCenter}>
            <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', color: '#6b7280' }} />
            <p style={{ marginTop: 12, color: '#6b7280', fontSize: 14 }}>Loading form…</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ──────────────────────────────────────────────────────────────
  if (metaError) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.loadingCenter}>
            <AlertCircle style={{ width: 32, height: 32, color: '#ef4444' }} />
            <p style={{ marginTop: 12, color: '#374151', fontWeight: 500 }}>{metaError}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success state ────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.loadingCenter}>
            <CheckCircle2 style={{ width: 48, height: 48, color: '#16a34a' }} />
            <h2 style={{ marginTop: 16, fontSize: 20, fontWeight: 600, color: '#111827' }}>
              Registration Submitted!
            </h2>
            <p style={{ marginTop: 8, fontSize: 14, color: '#374151', textAlign: 'center', lineHeight: 1.6 }}>
              Your candidate registration form has been received successfully.
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginTop: 16, lineHeight: 1.7 }}>
              Please check your email for your official e-form receipt (PDF).
              <br />
              Keep it safe — it serves as proof that you have purchased the electoral form.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.formHeader}>
          {/* Logo + name row */}
          <div style={styles.headerRow}>
            {meta?.association.logoUrl && (
              <img
                src={meta.association.logoUrl}
                alt={meta.association.name}
                style={{ height: 56, width: 56, objectFit: 'contain', flexShrink: 0 }}
              />
            )}
            <div style={styles.headerText}>
              <h1 style={styles.formTitle}>{meta?.association.name}</h1>
              {meta?.association.description && (
                <p style={styles.formSubtitleDesc}>{meta.association.description}</p>
              )}
              <p style={styles.formSubtitle}>Electoral Commission — Candidate Registration Form</p>
            </div>
          </div>
          <div style={styles.divider} />
          <p style={styles.formDesc}>
            This form is for aspiring candidates in the <strong>{meta?.election.title}</strong>.
            Fill in all fields accurately. Upon submission, you will receive an official e-form receipt by email.
            All fields are compulsory.
          </p>
        </div>

        {/* Global error */}
        {errors._global && (
          <div style={styles.globalError}>
            <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{errors._global}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            {/* First Name */}
            <div style={styles.field}>
              <label style={styles.label}>First Name <span style={styles.req}>*</span></label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                style={{ ...styles.input, ...(errors.firstName ? styles.inputError : {}) }}
              />
              {errors.firstName && <span style={styles.errorMsg}>{errors.firstName}</span>}
            </div>

            {/* Last Name */}
            <div style={styles.field}>
              <label style={styles.label}>Last Name <span style={styles.req}>*</span></label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                style={{ ...styles.input, ...(errors.lastName ? styles.inputError : {}) }}
              />
              {errors.lastName && <span style={styles.errorMsg}>{errors.lastName}</span>}
            </div>
          </div>

          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>Email Address <span style={styles.req}>*</span></label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="your@email.com"
              style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
            />
            {errors.email && <span style={styles.errorMsg}>{errors.email}</span>}
          </div>

          {/* Phone */}
          <div style={styles.field}>
            <label style={styles.label}>Phone Number <span style={styles.req}>*</span></label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 08012345678"
              style={{ ...styles.input, ...(errors.phone ? styles.inputError : {}) }}
            />
            {errors.phone && <span style={styles.errorMsg}>{errors.phone}</span>}
          </div>

          {/* Matric */}
          <div style={styles.field}>
            <label style={styles.label}>Matric Number <span style={styles.req}>*</span></label>
            <input
              name="matricNumber"
              value={form.matricNumber}
              onChange={handleChange}
              placeholder="e.g. CSC/2021/001"
              style={{ ...styles.input, ...(errors.matricNumber ? styles.inputError : {}) }}
            />
            {errors.matricNumber && <span style={styles.errorMsg}>{errors.matricNumber}</span>}
          </div>

          <div className="form-grid">
            {/* Level */}
            <div style={styles.field}>
              <label style={styles.label}>Level <span style={styles.req}>*</span></label>
              <Select
                value={form.level}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, level: val }));
                  if (errors.level) setErrors((prev) => ({ ...prev, level: '' }));
                }}
              >
                <SelectTrigger
                  style={{
                    width: '100%',
                    height: 38,
                    fontSize: 14,
                    ...(errors.level ? { borderColor: '#f87171', backgroundColor: '#fff7f7' } : {}),
                  }}
                >
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>{l} Level</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.level && <span style={styles.errorMsg}>{errors.level}</span>}
            </div>

            {/* Position */}
            <div style={styles.field}>
              <label style={styles.label}>Position Aspiring For <span style={styles.req}>*</span></label>
              <Select
                value={form.positionId}
                onValueChange={(val) => {
                  setForm((prev) => ({ ...prev, positionId: val }));
                  if (errors.positionId) setErrors((prev) => ({ ...prev, positionId: '' }));
                }}
              >
                <SelectTrigger
                  style={{
                    width: '100%',
                    height: 38,
                    fontSize: 14,
                    ...(errors.positionId ? { borderColor: '#f87171', backgroundColor: '#fff7f7' } : {}),
                  }}
                >
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {meta?.positions.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.positionId && <span style={styles.errorMsg}>{errors.positionId}</span>}
            </div>
          </div>

          <button type="submit" disabled={submitting} style={{ ...styles.submitBtn, ...(submitting ? styles.submitBtnDisabled : {}) }}>
            {submitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                Submitting…
              </span>
            ) : (
              'Submit Registration'
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        @media (max-width: 540px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

// ─── Inline styles (Google-Form-like, clean) ──────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: '32px 16px 64px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  card: {
    maxWidth: 640,
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  },
  loadingCenter: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '64px 32px',
  },
  formHeader: {
    background: '#fff',
    borderTop: '8px solid #1a1a2e',
    padding: '28px 32px 20px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 2,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  formSubtitleDesc: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    marginBottom: 0,
    fontStyle: 'italic' as const,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 6,
    marginBottom: 0,
    fontWeight: 500,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    margin: '16px 0',
  },
  formDesc: {
    fontSize: 13.5,
    color: '#374151',
    lineHeight: 1.65,
    margin: 0,
  },
  globalError: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    fontSize: 13,
    padding: '10px 32px',
    margin: '8px 0 0',
    borderRadius: 0,
  },
  fieldGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '12px 32px 0',
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 6,
  },
  req: {
    color: '#ef4444',
  },
  input: {
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '9px 12px',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    transition: 'border-color 0.15s',
    backgroundColor: '#fff',
    width: '100%',
  },
  inputError: {
    borderColor: '#f87171',
    backgroundColor: '#fff7f7',
  },
  select: {
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '9px 12px',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    backgroundColor: '#fff',
    width: '100%',
    cursor: 'pointer',
  },
  errorMsg: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  submitBtn: {
    display: 'block',
    width: 'calc(100% - 64px)',
    margin: '24px 32px',
    padding: '11px 24px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  refBox: {
    marginTop: 20,
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '14px 24px',
    textAlign: 'center' as const,
  },
};
