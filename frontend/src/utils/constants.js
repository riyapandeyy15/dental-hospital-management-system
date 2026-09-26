export const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
};

export function dashboardPathForRole(role) {
  if (role === ROLES.ADMIN) return '/admin/dashboard';
  if (role === ROLES.DOCTOR) return '/doctor/dashboard';
  if (role === ROLES.PATIENT) return '/patient/dashboard';
  return '/';
}

export const AUTH_TOKEN_STORAGE_KEY = 'dental_hms_token';
