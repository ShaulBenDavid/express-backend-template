const UNIT_MAP: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function ms(duration: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration.trim());
  if (!match) {
    throw new Error(
      `Invalid duration format: "${duration}". Expected e.g. "30d", "15m", "1h", "30s".`,
    );
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];
  return value * UNIT_MAP[unit];
}
