'use client';

import { useEffect } from 'react';

export default function LocatorDev() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@locator/runtime').then(({ default: locator }) => {
        locator();
      });
    }
  }, []);
  return null;
}
