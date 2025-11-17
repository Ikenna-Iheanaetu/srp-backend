export const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

// Validate on startup
if (isNaN(BCRYPT_SALT_ROUNDS) || BCRYPT_SALT_ROUNDS < 10) {
  throw new Error('BCRYPT_SALT_ROUNDS must be a number >= 10');
}
