import { getAuthRedirectPath } from './authRedirect';

describe('auth redirect', () => {
  test('keeps a worker on the new leave request page after session hydration', () => {
    expect(getAuthRedirectPath('/worker/leaves/new', 'worker')).toBeNull();
  });

  test('sends a signed-in worker away from the login page', () => {
    expect(getAuthRedirectPath('/login', 'worker')).toBe('/worker/dashboard');
  });

  test('sends a signed-in user away from the wrong role area', () => {
    expect(getAuthRedirectPath('/admin/leaves', 'worker')).toBe(
      '/worker/dashboard',
    );
  });

  test('sends signed-out users to login outside public auth pages', () => {
    expect(getAuthRedirectPath('/worker/leaves/new', null)).toBe('/login');
  });
});
