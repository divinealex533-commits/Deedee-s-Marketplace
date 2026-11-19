export type FormState =
  | {
      error?: string;
      ok?: string;
      step?: 'request' | 'code' | 'done';
      phone?: string;
    }
  | undefined;
