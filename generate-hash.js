import bcrypt from 'bcryptjs';

// Generate bcrypt hash for password Art@1204
const password = 'Art@1204';
const hash = await bcrypt.hash(password, 10);

console.log('Password:', password);
console.log('Bcrypt Hash:', hash);
console.log('\nUse this hash in the database:');
console.log(`UPDATE admins SET password_hash = '${hash}' WHERE username = 'Art1204';`);

// Verify it works
const isValid = await bcrypt.compare(password, hash);
console.log('\nVerification:', isValid ? '✓ Valid' : '✗ Invalid');
