import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { checkLoginId, checkPhoneNumber } from '../../api/auth';
import { loginIdSchema, phoneNumberSchema } from '../../validation/auth';

type Field = 'id' | 'phone';

interface AvailabilityState {
  value: string;
  validation: 'success' | 'error' | undefined;
  messageKey: string | undefined;
  checking: boolean;
}

const useRegisterAvailability = (field: Field) => {
  const [state, setState] = useState<AvailabilityState>({
    value: '',
    validation: undefined,
    messageKey: undefined,
    checking: false,
  });
  const requestRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusedRef = useRef(true);
  const pendingValueRef = useRef<string | null>(null);

  const check = useCallback(
    (value: string) => {
      requestRef.current += 1;
      const request = requestRef.current;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      pendingValueRef.current = null;
      const schema = field === 'id' ? loginIdSchema : phoneNumberSchema;
      const valid = schema.safeParse(value).success;
      setState({ value, validation: undefined, messageKey: undefined, checking: valid });
      if (!valid || !focusedRef.current) return;

      pendingValueRef.current = value;
      timerRef.current = setTimeout(async () => {
        timerRef.current = null;
        const isCurrent = () => focusedRef.current && requestRef.current === request;
        try {
          const { available } = await (field === 'id' ? checkLoginId : checkPhoneNumber)(value);
          if (!isCurrent()) return;
          setState({
            value,
            validation: available ? 'success' : 'error',
            messageKey: `auth.register.basic.error.${field}${available ? 'Available' : 'Taken'}`,
            checking: false,
          });
        } catch {
          if (!isCurrent()) return;
          setState({
            value,
            validation: 'error',
            messageKey: 'auth.register.basic.error.checkError',
            checking: false,
          });
        } finally {
          if (isCurrent()) pendingValueRef.current = null;
        }
      }, 500);
    },
    [field]
  );

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      // Retry an interrupted check when returning from terms/privacy screens.
      if (pendingValueRef.current !== null) check(pendingValueRef.current);
      return () => {
        focusedRef.current = false;
        requestRef.current += 1;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
      };
    }, [check])
  );

  const isAvailable = (value: string) =>
    state.value === value && state.validation === 'success' && !state.checking;

  // Event handlers also check pending work before React commits the next state.
  const canSubmit = (value: string) =>
    focusedRef.current && pendingValueRef.current === null && isAvailable(value);

  return { ...state, check, isAvailable, canSubmit };
};

export default useRegisterAvailability;
