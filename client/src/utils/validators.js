// Each validator returns an error message, or '' when the value is fine.
// These only improve the user experience. The backend (Phase 4) repeats every check,
// because anyone can bypass the browser and call the API directly.

export const validateName = (v) =>
  v.trim().length >= 2 ? '' : 'Enter your full name (at least 2 characters).'

export const validateEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : 'Enter a valid email address.'

export const validatePhone = (v) =>
  /^[0-9]{10}$/.test(v.replace(/[\s-]/g, '')) ? '' : 'Enter a 10-digit mobile number.'

export const validatePassword = (v) => {
  if (v.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) return 'Include at least one letter and one number.'
  return ''
}
