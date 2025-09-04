import { hashPassword, verifyPassword } from './auth.utils';

describe('Password hashing', () => {
  it('should hash password and verify correctly', async () => {
    const password = 'MySecurePass123!';
    const hashed = await hashPassword(password);
    
    console.log('password', password);
    console.log('hashed', hashed);
    expect(hashed).not.toEqual(password);
    expect(await verifyPassword(password, hashed)).toBe(true);
    expect(await verifyPassword('WrongPass', hashed)).toBe(false);
  });
});
