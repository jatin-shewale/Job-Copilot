import { useState, useEffect, useCallback, useRef } from 'react';

// ── useLocalStorage ────────────────────────────────────────────────────
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = useCallback((val) => {
    try {
      setValue(val);
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch (err) {
      console.warn('localStorage write failed:', err);
    }
  }, [key]);

  return [value, setStoredValue];
}

// ── useDebounce ────────────────────────────────────────────────────────
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ── useAsync ───────────────────────────────────────────────────────────
export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ data: null, loading: false, error: null });
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const execute = useCallback(async (...args) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await asyncFn(...args);
      if (mountedRef.current) setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      if (mountedRef.current) setState({ data: null, loading: false, error });
      throw error;
    }
  }, deps);

  return { ...state, execute };
}

// ── useInterval ────────────────────────────────────────────────────────
export function useInterval(callback, delay) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ── useCopyToClipboard ─────────────────────────────────────────────────
export function useCopyToClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
    });
  }, [timeout]);
  return [copied, copy];
}
