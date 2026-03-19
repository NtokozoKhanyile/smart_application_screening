import { format, formatDistanceToNow, parseISO } from 'date-fns'

export const formatDate = (dateString) => {
  if (!dateString) return '—'
  try {
    return format(parseISO(dateString), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

export const formatDateTime = (dateString) => {
  if (!dateString) return '—'
  try {
    return format(parseISO(dateString), 'dd MMM yyyy, HH:mm')
  } catch {
    return '—'
  }
}

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '—'
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
  } catch {
    return '—'
  }
}

export const formatScore = (score) => {
  if (score === null || score === undefined) return '—'
  return `${Number(score).toFixed(1)}%`
}

export const formatName = (firstName, middleName, surname) => {
  return [firstName, middleName, surname].filter(Boolean).join(' ')
}

export const truncate = (str, length = 30) => {
  if (!str) return '—'
  return str.length > length ? `${str.substring(0, length)}...` : str
}