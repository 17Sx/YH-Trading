import { memo, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface DebouncedInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  type?: string;
}

export const DebouncedInput = memo(({ 
  value, 
  onChange, 
  placeholder, 
  delay = 300, 
  className = '',
  type = 'text'
}: DebouncedInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, delay);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (value !== localValue && !isFirstRender.current) {
      setLocalValue(value);
    }
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
  }, [value]);

  useEffect(() => {
    if (debouncedValue !== value && !isFirstRender.current) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <input
      type={type}
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
});

DebouncedInput.displayName = 'DebouncedInput';

interface Option {
  value: string;
  label: string;
}

interface OptimizedSelectProps {
  options: Option[];
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const OptimizedSelect = memo(({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  className = '' 
}: OptimizedSelectProps) => {
  const memoizedOptions = useMemo(() => options, [options]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      className={className}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {memoizedOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});

OptimizedSelect.displayName = 'OptimizedSelect';

interface DebouncedTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  delay?: number;
  className?: string;
  maxRows?: number;
}

export const DebouncedTextarea = memo(({ 
  value, 
  onChange, 
  placeholder, 
  delay = 500,
  className = '',
  maxRows = 10
}: DebouncedTextareaProps) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, delay);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, maxRows * 24);
      textarea.style.height = `${newHeight}px`;
    }
  }, [maxRows]);

  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    adjustHeight();
  }, [localValue, adjustHeight]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <textarea
      ref={textareaRef}
      value={localValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      style={{ resize: 'none', overflow: 'hidden' }}
    />
  );
});

DebouncedTextarea.displayName = 'DebouncedTextarea';

interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

interface UseFormValidationOptions<T> {
  initialValues: T;
  validationRules: Partial<Record<keyof T, ValidationRule<any>[]>>;
  validateOnChange?: boolean;
  debounceValidation?: number;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  validateOnChange = true,
  debounceValidation = 300
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const debouncedValues = useDebounce(values, debounceValidation);

  const validateField = useCallback((field: keyof T, value: any): string | undefined => {
    const rules = validationRules[field];
    if (!rules) return undefined;

    for (const rule of rules) {
      if (!rule.validate(value)) {
        return rule.message;
      }
    }
    return undefined;
  }, [validationRules]);

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(values).forEach((key) => {
      const fieldKey = key as keyof T;
      const error = validateField(fieldKey, values[fieldKey]);
      if (error) {
        newErrors[fieldKey] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  useEffect(() => {
    if (validateOnChange) {
      Object.keys(debouncedValues).forEach((key) => {
        const fieldKey = key as keyof T;
        if (touched[fieldKey]) {
          const error = validateField(fieldKey, debouncedValues[fieldKey]);
          setErrors(prev => ({
            ...prev,
            [fieldKey]: error
          }));
        }
      });
    }
  }, [debouncedValues, validateOnChange, touched, validateField]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    validateAll,
    resetForm,
    isValid: Object.keys(errors).length === 0
  };
}

interface OptimizedFormProps {
  children: React.ReactNode;
  onSubmit: (data: any) => Promise<void> | void;
  className?: string;
  isLoading?: boolean;
}

export const OptimizedForm = memo(({ 
  children, 
  onSubmit, 
  className = '',
  isLoading = false 
}: OptimizedFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;

    try {
      setIsSubmitting(true);
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());
      await onSubmit(data);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, isSubmitting, isLoading]);

  return (
    <form 
      onSubmit={handleSubmit} 
      className={className}
      noValidate
    >
      <fieldset disabled={isSubmitting || isLoading}>
        {children}
      </fieldset>
    </form>
  );
});

OptimizedForm.displayName = 'OptimizedForm'; 