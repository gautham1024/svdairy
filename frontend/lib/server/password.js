import crypto from 'crypto';

// Built-in scrypt, stored as "salt:hash" (hex)
export const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(String(password), salt, 64).toString('hex')}`;
};

export const verifyPassword = (password, stored) => {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const actual = crypto.scryptSync(String(password ?? ''), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
};

if (process.argv[1]?.endsWith('password.js')) { // run: node lib/server/password.js
  const h = hashPassword('secret123');
  console.assert(verifyPassword('secret123', h), 'correct password should verify');
  console.assert(!verifyPassword('wrong', h), 'wrong password should fail');
  console.assert(!verifyPassword('x', ''), 'empty hash should fail');
  console.log('password self-check ok');
}
