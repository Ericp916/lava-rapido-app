export const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function normalizePlate(value = '') {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
}

export function formatPlate(value = '') {
  const plate = normalizePlate(value)
  if (plate.length <= 3) return plate
  return `${plate.slice(0, 3)}-${plate.slice(3)}`
}

export function isValidPlate(value = '') {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalizePlate(value))
}

export function digitsOnly(value = '') {
  return String(value).replace(/\D/g, '')
}

export function sanitizeMoneyInput(value = '') {
  let clean = String(value).replace(/[^0-9,.]/g, '').replace(/\./g, ',')
  const commaIndex = clean.indexOf(',')

  if (commaIndex >= 0) {
    const whole = clean.slice(0, commaIndex).replace(/,/g, '')
    const decimals = clean.slice(commaIndex + 1).replace(/,/g, '').slice(0, 2)
    clean = `${whole},${decimals}`
  }

  return clean
}

export function parseMoneyInput(value = '') {
  const normalized = sanitizeMoneyInput(value).replace(',', '.')
  const number = Number(normalized)
  return Number.isFinite(number) ? number : 0
}

export function completeMoneyInput(value = '') {
  if (!value) return ''
  const amount = parseMoneyInput(value)
  if (!amount) return sanitizeMoneyInput(value)
  return amount.toFixed(2).replace('.', ',')
}

export function whatsappUrl(phone, message) {
  let digits = digitsOnly(phone)
  if (!digits) return null
  if (!digits.startsWith('55')) digits = `55${digits}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateKey(value = '') {
  const [year, month, day] = String(value).slice(0, 10).split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export function localDayRange(date = new Date()) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function periodRange(type, base = new Date()) {
  const start = new Date(base)
  const end = new Date(base)

  if (type === 'daily') {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else if (type === 'weekly') {
    const day = start.getDay()
    const diff = day === 0 ? -6 : 1 - day
    start.setDate(start.getDate() + diff)
    start.setHours(0, 0, 0, 0)
    end.setTime(start.getTime())
    end.setDate(end.getDate() + 6)
    end.setHours(23, 59, 59, 999)
  } else {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    end.setMonth(end.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
  }

  return { start: start.toISOString(), end: end.toISOString() }
}
