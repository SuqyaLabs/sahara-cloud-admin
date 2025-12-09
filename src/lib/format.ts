import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Format currency in Algerian Dinar (DA)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount) + ' DA'
}

/**
 * Format a date relative to now
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isToday(d)) {
    return format(d, 'HH:mm', { locale: fr })
  }
  
  if (isYesterday(d)) {
    return 'Hier ' + format(d, 'HH:mm', { locale: fr })
  }
  
  return format(d, 'dd/MM/yyyy HH:mm', { locale: fr })
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, formatStr, { locale: fr })
}

/**
 * Format time ago
 */
export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: fr })
}

/**
 * Format percentage change
 */
export function formatPercentChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%'
  const change = ((current - previous) / previous) * 100
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

/**
 * Format large numbers with K, M suffix
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
