import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined') {
  // Mock ResizeObserver for UI components
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });

  // Mock scrollTo
  window.scrollTo = () => {};

  // Mock clipboard
  if (!navigator.clipboard) {
    Object.assign(navigator, {
      clipboard: {
        writeText: () => Promise.resolve(),
      },
    });
  }
}
