/**
 * Seed 15 realistic test users for development/QA.
 *
 * Usage:  npx tsx src/database/seed-test-users.ts
 * Script: npm run db:seed:test-users
 *
 * Idempotent — skips users whose email already exists (ON CONFLICT DO NOTHING).
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { query, closePool } from '../config/database.config.js';

const USER_ROLE_ID = '11111111-1111-1111-1111-111111111101';
const DEFAULT_PASSWORD = 'Test1234!';

const TEST_USERS = [
  { email: 'john.doe@balancia.test', firstName: 'John', lastName: 'Doe', gender: 'male', dob: '1990-03-15' },
  { email: 'jane.smith@balancia.test', firstName: 'Jane', lastName: 'Smith', gender: 'female', dob: '1988-07-22' },
  { email: 'alex.johnson@balancia.test', firstName: 'Alex', lastName: 'Johnson', gender: 'male', dob: '1995-01-10' },
  { email: 'maria.garcia@balancia.test', firstName: 'Maria', lastName: 'Garcia', gender: 'female', dob: '1992-11-30' },
  { email: 'david.chen@balancia.test', firstName: 'David', lastName: 'Chen', gender: 'male', dob: '1985-05-18' },
  { email: 'sarah.williams@balancia.test', firstName: 'Sarah', lastName: 'Williams', gender: 'female', dob: '1993-09-04' },
  { email: 'omar.hassan@balancia.test', firstName: 'Omar', lastName: 'Hassan', gender: 'male', dob: '1991-12-25' },
  { email: 'emily.brown@balancia.test', firstName: 'Emily', lastName: 'Brown', gender: 'female', dob: '1997-02-14' },
  { email: 'carlos.martinez@balancia.test', firstName: 'Carlos', lastName: 'Martinez', gender: 'male', dob: '1989-06-08' },
  { email: 'aisha.khan@balancia.test', firstName: 'Aisha', lastName: 'Khan', gender: 'female', dob: '1994-04-20' },
  { email: 'lucas.taylor@balancia.test', firstName: 'Lucas', lastName: 'Taylor', gender: 'male', dob: '1996-08-12' },
  { email: 'sofia.anderson@balancia.test', firstName: 'Sofia', lastName: 'Anderson', gender: 'female', dob: '1990-10-03' },
  { email: 'james.wilson@balancia.test', firstName: 'James', lastName: 'Wilson', gender: 'male', dob: '1987-01-28' },
  { email: 'nina.patel@balancia.test', firstName: 'Nina', lastName: 'Patel', gender: 'female', dob: '1998-03-17' },
  { email: 'ryan.lee@balancia.test', firstName: 'Ryan', lastName: 'Lee', gender: 'male', dob: '1993-07-09' },
];

async function seedTestUsers() {
  console.log('Seeding 15 test users...\n');

  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

  let created = 0;
  let skipped = 0;

  for (const u of TEST_USERS) {
    const result = await query(
      `INSERT INTO users (
        email, password, first_name, last_name, date_of_birth, gender,
        auth_provider, onboarding_status, is_email_verified, is_active, role_id
      ) VALUES ($1, $2, $3, $4, $5, $6::gender, 'local', 'completed', true, true, $7)
      ON CONFLICT (email) DO NOTHING
      RETURNING id`,
      [u.email, hash, u.firstName, u.lastName, u.dob, u.gender, USER_ROLE_ID],
    );

    if (result.rowCount && result.rowCount > 0) {
      const userId = result.rows[0].id;
      await query('INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
      console.log(`  + ${u.firstName} ${u.lastName} (${u.email})`);
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`\nDone: ${created} created, ${skipped} already existed.`);
  console.log(`Password for all test users: ${DEFAULT_PASSWORD}`);
}

seedTestUsers()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => closePool());
