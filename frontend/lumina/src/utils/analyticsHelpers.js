export const C = {
  navy: '#1B2B6B',
  gold: '#D4A017',
  green: '#16A34A',
  red: '#DC2626',
  amber: '#D97706',
  purple: '#7C3AED',
  blue: '#2563EB',
  gray: '#94A3B8',
  indigo: '#4F46E5',
  teal: '#0D9488',
  lightGray: '#E2E8F0',
}

export const CHART = {
  margin: { top: 5, right: 10, left: -20, bottom: 0 },
  marginWide: { top: 5, right: 30, left: -20, bottom: 0 },
  axisTick: { fontSize: 10, fill: '#64748B' },
  axisTickLarge: { fontSize: 11, fill: '#64748B' },
  labelStyle: { fontSize: 10, fill: '#64748B' },
}

export const normalizeCourseName = (course, course_id) => {
  const raw = course?.name || `Course #${course_id}`
  return raw.replace(/^(BSc|BCom|BA|BEng) /, '')
}

export const percentage = (value) => (value == null ? '—' : `${value}%`)
