import { Transform } from 'class-transformer';

/** Trim surrounding whitespace on string input; leave anything else for validation to reject. */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value));

/** Trim and lowercase (categories are stored lowercase). */
export const TrimLower = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );
