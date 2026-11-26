import { ValueTransformer } from 'typeorm';

/**
 * MySQL returns DECIMAL columns as strings (e.g. "40.00") to avoid losing
 * precision. This converts them to JavaScript numbers for the API responses.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : Number(value),
};
