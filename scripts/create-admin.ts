import { db } from '../server/storage';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to promote a user to admin role
 * Usage: tsx scripts/create-admin.ts <email>
 */

async function createAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Please provide an email address');
    console.error('Usage: tsx scripts/create-admin.ts <email>');
    process.exit(1);
  }

  try {
    const result = await db
      .update(users)
      .set({ role: 'admin' })
      .where(eq(users.email, email))
      .returning();

    if (result.length === 0) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    console.log(`✅ Successfully promoted ${email} to admin`);
    console.log('User details:', result[0]);
    process.exit(0);
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    process.exit(1);
  }
}

createAdmin();
