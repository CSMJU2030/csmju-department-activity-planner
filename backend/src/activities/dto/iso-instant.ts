import { applyDecorators } from '@nestjs/common';
import { IsDateString, Matches } from 'class-validator';

/**
 * ISO 8601 date-time that names its own timezone (`Z` or `+07:00`). A bare
 * local time would be read in the server's zone, so it is rejected.
 */
export const IsInstant = () =>
  applyDecorators(
    IsDateString({ strict: true }),
    Matches(/(?:Z|[+-]\d{2}:\d{2})$/, { message: '$property must include a timezone offset' }),
  );
