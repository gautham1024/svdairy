const crypto = require('crypto');

// Built-in scrypt, stored as "salt:hash" (hex)
exports.hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(String(password), salt, 64).toString('hex')}`;
};

exports.verifyPassword = (password, stored) => {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const actual = crypto.scryptSync(String(password ?? ''), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
};

if (require.main === module) {
  const h = exports.hashPassword('secret123');
  console.assert(exports.verifyPassword('secret123', h), 'correct password should verify');
  console.assert(!exports.verifyPassword('wrong', h), 'wrong password should fail');
  console.assert(!exports.verifyPassword('x', ''), 'empty hash should fail');
  console.log('password self-check ok');
}
