import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { checkLoginId, checkPhoneNumber } from '../../api/auth';
import { queryClient, resourceKey } from '../../query/client';
import { useDebouncedValue, useServerQuery, useSessionScope } from '../../query/hooks';
import { loginIdSchema, phoneNumberSchema } from '../../validation/auth';

const useRegisterAvailability = (field: 'id' | 'phone') => {
  const [value, setValue] = useState('');
  const inputRef = useRef('');
  const acceptedRef = useRef<string | null>(null);
  const focusedRef = useRef(true);
  const scope = useSessionScope();
  const debounced = useDebouncedValue(value, 500);
  const valid = (field === 'id' ? loginIdSchema : phoneNumberSchema).safeParse(value).success;
  const query = useServerQuery(
    'availability',
    [field, value],
    (signal) => (field === 'id' ? checkLoginId : checkPhoneNumber)(value, signal),
    { public: true, enabled: valid && value === debounced, staleTime: 0, gcTime: 0, retry: false }
  );
  const checking = valid && (value !== debounced || query.isFetching || !query.isFetched);
  let validation: 'success' | 'error' | undefined;
  if (valid && !checking)
    validation = query.isError || !query.data?.available ? 'error' : 'success';
  let messageKey: string | undefined;
  if (validation)
    messageKey = query.isError
      ? 'auth.register.basic.error.checkError'
      : `auth.register.basic.error.${field}${query.data?.available ? 'Available' : 'Taken'}`;
  useEffect(() => {
    if (inputRef.current === value && validation === 'success') acceptedRef.current = value;
  }, [value, validation, query.dataUpdatedAt]);
  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      return () => {
        focusedRef.current = false;
      };
    }, [])
  );
  const check = (next: string) => {
    inputRef.current = next;
    acceptedRef.current = null;
    setValue(next);
    void queryClient.invalidateQueries({
      queryKey: resourceKey(scope.version, scope.language, 'availability', field, next),
      exact: true,
    });
  };
  const isAvailable = (input: string) => input === value && validation === 'success' && !checking;
  const canSubmit = (input: string) =>
    focusedRef.current &&
    acceptedRef.current === input &&
    inputRef.current === input &&
    isAvailable(input);
  return { value, checking, validation, messageKey, check, isAvailable, canSubmit };
};
export default useRegisterAvailability;
