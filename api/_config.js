const DEFAULT_TOTAL_DAYS = 90;
const DEFAULT_TITLE_SUFFIX = 'Dias — Foco Total';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function totalDays() {
  const configured = Number(process.env.CHALLENGE_DAYS);
  if (Number.isInteger(configured) && configured > 0 && configured <= 365) {
    return configured;
  }
  return DEFAULT_TOTAL_DAYS;
}

function defaultStartDate() {
  return process.env.CHALLENGE_START_DATE || todayKey();
}

function tablePrefix() {
  const prefix = process.env.TABLE_PREFIX || '';
  if (prefix && !/^[A-Za-z_][A-Za-z0-9_]*$/.test(prefix)) {
    throw new Error('TABLE_PREFIX must contain only letters, numbers, and underscores');
  }
  return prefix;
}

function tableName(base) {
  if (!['days', 'events', 'settings'].includes(base)) {
    throw new Error(`Unknown table: ${base}`);
  }
  return `"${tablePrefix()}${base}"`;
}

function challengeConfig() {
  const days = totalDays();
  return {
    totalDays: days,
    defaultStartDate: defaultStartDate(),
    title: process.env.CHALLENGE_TITLE || `${days} ${DEFAULT_TITLE_SUFFIX}`,
    tables: {
      days: tableName('days'),
      events: tableName('events'),
      settings: tableName('settings'),
    },
  };
}

module.exports = { challengeConfig, todayKey };
