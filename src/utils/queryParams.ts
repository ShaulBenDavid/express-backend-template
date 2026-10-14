const MAX_PAGE_LIMIT = 500;

export const parsePositiveIntParam = (value: unknown): number | undefined => {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export const parseLimitParam = (value: unknown): number | undefined => {
  const parsed = parsePositiveIntParam(value);
  return parsed === undefined ? undefined : Math.min(parsed, MAX_PAGE_LIMIT);
};
