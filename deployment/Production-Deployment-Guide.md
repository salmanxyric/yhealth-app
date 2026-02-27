

1. **Create Database Extensions**
   ```sql
   -- Connect to database (via railway connect postgres or psql)
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pgcrypto";
   ```

2. **Run Database Setup**
   ```bash
   # Option A: Using Railway CLI
   railway run --service server npm run db:setup
   
   # Option B: Using Railway Dashboard
   # Go to server service → Deployments → Latest → View Logs
   # Or use the "Run Command" feature in Railway dashboard
   ```

3. **Run All Migrations**
   ```bash
   railway run --service server npm run db:migrate
   railway run --service server npm run db:migrate:health-metrics
   railway run --service server npm run db:migrate:chat
   railway run --service server npm run db:migrate:schedule
   railway run --service server npm run db:migrate:goal-tracking
   railway run --service server npm run db:migrate:breathing-tests
   railway run --service server npm run db:migrate:emotional-checkin
   railway run --service server npm run db:migrate:activity-status
   railway run --service server npm run db:migrate:activity-automation
   railway run --service server npm run db:migrate:schedule-automation
   railway run --service server npm run db:migrate:contact
   railway run --service server npm run db:migrate:roles
   railway run --service server npm run db:migrate:visitors
   railway run --service server npm run db:migrate:subscriptions
   railway run --service server npm run db:migrate:blog-image
   ```

4. **Run Individual Migration Files**
   ```bash
   railway run --service server npx tsx src/database/run-migration.ts add-leaderboard-competitions-tables.sql
   railway run --service server npx tsx src/database/run-migration.ts add-leaderboard-user-fields.sql
   railway run --service server npx tsx src/database/run-migration.ts add-competition-chat-tables.sql
   railway run --service server npx tsx src/database/run-migration.ts add-activity-events-table.sql
   railway run --service server npx tsx src/database/run-migration.ts add-voice-assistant-avatar.sql
   railway run --service server npx tsx src/database/run-migration.ts add-voice-assistant-name.sql
   railway run --service server npx tsx src/database/run-migration.ts add-voice-calls-session-type.sql
   railway run --service server npx tsx src/database/run-migration.ts add-voice-schedule-prefs.sql
   railway run --service server npx tsx src/database/run-migration.ts add-role-status-fields.sql
   railway run --service server npx tsx src/database/run-migration.ts adaptive-nutrition-tables.sql
   railway run --service server npx tsx src/database/run-migration.ts add-wellbeing-vector-indexes.sql
   ```

### 11.4 Seed Data

Run seed scripts in this exact order:

```bash
# 1. Subscription Plans (required - auto-seeds on startup if empty)
railway run --service server npm run db:seed:subscription-plans

# 2. Assessment Questions (77k+ entries - takes several minutes)
railway run --service server npm run db:seed:questions

# 3. AI Coach System User (required for AI features)
railway run --service server npx tsx src/database/seed-ai-coach-user.ts

# 4. Exercise Library
railway run --service server npx tsx src/database/seed-exercises.ts

# 5. Blog Articles
railway run --service server npm run db:seed:blogs

# 6. Competition Templates (optional - for leaderboard)
railway run --service server npx tsx src/database/seed-competitions.ts

# 7. Community Group (run AFTER at least one user exists)
railway run --service server npm run db:seed:community
```

### 11.5 Verify Setup

```bash
# Check server health
curl https://your-railway-app.railway.app/api/health

# Check subscription plans exist
railway run --service server npx tsx -e "
  import { pool } from './src/database/pool';
  const result = await pool.query('SELECT name, is_active FROM subscription_plans');
  console.log(result.rows);
  process.exit(0);
"
```

### 11.6 Configure Client Service (Next.js Frontend)

1. **Create Client Service**
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Set root directory to `client`
   - Set start command: `npm start`

2. **Set Environment Variables**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://your-server-service.railway.app/api
   ```

3. **Build Settings**
   - Railway will auto-detect Next.js
   - Build command: `npm run build`
   - Start command: `npm start`

### 11.7 Generate Domain URLs

1. **Server Domain**
   - Go to server service → Settings → Generate Domain
   - Copy the generated URL (e.g., `yhealth-server-production.up.railway.app`)
   - Update `CORS_ORIGIN` and `CLIENT_URL` in server variables

2. **Client Domain**
   - Go to client service → Settings → Generate Domain
   - Copy the generated URL
   - Update `NEXT_PUBLIC_API_URL` in client variables to point to server domain

### 11.8 Railway-Specific Notes

- **Database Migrations:** Run via Railway CLI or dashboard "Run Command" feature
- **Environment Variables:** Use Railway's variable reference syntax: `${{ServiceName.VARIABLE}}`
- **Logs:** View in Railway dashboard → Service → Deployments → View Logs
- **Restarts:** Railway auto-restarts on code push or variable changes
- **Scaling:** Adjust instance count in service settings if needed

### 11.9 Quick Railway Setup Checklist

- [ ] PostgreSQL service created and connected
- [ ] Server service deployed with all environment variables
- [ ] Database extensions created (`uuid-ossp`, `pgcrypto`)
- [ ] Database schema setup completed (`npm run db:setup`)
- [ ] All migrations run successfully
- [ ] Subscription plans seeded
- [ ] Assessment questions seeded
- [ ] AI Coach user created
- [ ] Exercise library seeded
- [ ] Blog articles seeded (optional)
- [ ] Client service deployed with correct API URL
- [ ] Server health check passes
- [ ] CORS configured correctly