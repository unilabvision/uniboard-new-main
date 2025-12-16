// global.d.ts
import { ReCaptchaInstance } from 'react-google-recaptcha';

declare global {
  interface Window {
    grecaptcha?: {
      ready: () => Promise<void>;
      execute: (siteKey: string, options: { action?: string }) => Promise<string>;
    } & ReCaptchaInstance;
  }
}

export {};