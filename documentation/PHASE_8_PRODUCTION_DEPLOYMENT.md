# 🚀 Phase 8 - Production Deployment & Maintenance

**Status:** Ready for Implementation  
**Last Updated:** December 21, 2025  
**Objective:** Deploy to production and establish ongoing maintenance

---

## 📋 Overview

Phase 8 covers:

- ✅ Pre-deployment checks
- ✅ Staging to production migration
- ✅ Monitoring & alerting setup
- ✅ Rollback procedures
- ✅ Maintenance schedules
- ✅ Documentation & training

---

## ✅ Pre-Deployment Checklist

### Database (Phase 1)
- [ ] All tables created and indexed
- [ ] RLS policies configured
- [ ] Views created for monitoring
- [ ] Backup strategy in place
- [ ] Database size within limits

### Edge Functions (Phase 2)
- [ ] All 4 functions deployed
- [ ] Environment variables set
- [ ] Timeout values appropriate
- [ ] Error logging working
- [ ] Load tested

### Frontend Integration (Phase 3)
- [ ] Queue manager integrated
- [ ] Real-time listeners active
- [ ] 5-minute processor working
- [ ] No console errors
- [ ] Memory leaks tested

### User Preferences UI (Phase 4)
- [ ] Preferences screen functional
- [ ] All settings save correctly
- [ ] UI responsive on all devices
- [ ] Accessibility compliant

### Real-World Triggers (Phase 5)
- [ ] Budget detection working
- [ ] Anomaly detection tested
- [ ] Goal tracking verified
- [ ] Achievements functional

### Monitoring (Phase 6)
- [ ] Dashboards accessible
- [ ] Error tracking configured
- [ ] Alerts working
- [ ] Data retention policies set

### Testing (Phase 7)
- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] UAT completed
- [ ] Performance benchmarks met
- [ ] Known issues documented

---

## 🔄 Staging to Production Migration

### Step 1: Create Production Environment

**Supabase Setup:**
```bash
# Create new Supabase project for production (if not already done)
supabase projects list

# Or use existing production project
# Ensure it's separate from staging

# Set environment variable
export SUPABASE_PROJECT_ID=your-prod-project-id
export SUPABASE_API_KEY=your-prod-api-key
```

### Step 2: Deploy Database Schema

```bash
# 1. Backup staging database (if data to preserve)
pg_dump -h staging.db.supabase.co -U postgres -d postgres > staging_backup.sql

# 2. Run schema on production
# In Supabase SQL Editor for production project:
# Copy entire NOTIFICATION_SYSTEM_ENHANCED_SCHEMA.sql
# Click Run

# 3. Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'notification_%';
```

### Step 3: Deploy Edge Functions

```bash
# Set production project
supabase projects set-prod YOUR-PROD-PROJECT-ID

# Deploy functions
supabase functions deploy send-notification --prod
supabase functions deploy schedule-daily-jobs --prod
supabase functions deploy process-queue --prod
supabase functions deploy schedule-weekly-jobs --prod

# Verify deployment
supabase functions list
# Should show all 4 with status: "Active"
```

### Step 4: Configure CRON Schedules

```bash
# In Supabase Dashboard → Edge Functions → schedule-daily-jobs
# Set CRON to run at specific times

# Example CRON expressions:
# Daily at 7 PM UTC: 0 19 * * *
# Daily at 7 AM UTC: 0 7 * * *
# Every 5 minutes: */5 * * * *

# Edit function details to add CRON trigger
```

### Step 5: Update App Environment Variables

**File:** `.env.production` or `.env`

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key

# Optional: For production monitoring
SENTRY_DSN=your-sentry-dsn (optional error tracking)
SLACK_WEBHOOK_URL=your-slack-webhook (optional alerting)
```

### Step 6: Build & Deploy App

```bash
# Build app with production credentials
eas build --platform ios --auto-submit
eas build --platform android --auto-submit

# Or publish updates via EAS:
eas update --message "Deploy notification system v1.0"
```

### Step 7: Data Migration (if needed)

```bash
# If migrating existing users from old system:

-- Copy push tokens
INSERT INTO push_tokens (user_id, token, platform, is_valid, created_at)
SELECT user_id, token, platform, true, NOW()
FROM old_push_tokens
ON CONFLICT (token) DO NOTHING;

-- Initialize notification preferences for all users
INSERT INTO notification_preferences (user_id, timezone, daily_reminder_enabled)
SELECT DISTINCT user_id, 'UTC', true
FROM records
WHERE user_id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;
```

---

## 📊 Production Monitoring Setup

### 1. Set Up Alerts

**Supabase Functions → Monitoring:**
```bash
# Monitor function invocations and errors
# Set up email alerts for:
# - Function errors (any)
# - High latency (> 5 seconds)
# - High error rate (> 5%)
```

**Database Alerts:**
```bash
# Monitor:
# - High connection count
# - Slow queries
# - Disk space usage
```

### 2. Configure Error Tracking

**Option A: Sentry Integration**
```typescript
// In app._layout.tsx
import * as Sentry from "sentry-expo";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.ENV,
  tracesSampleRate: 0.1,
});

// Wrap app navigation
Sentry.wrapNavigationContainer(NavigationContainer);
```

**Option B: Custom Error Logging**
```typescript
// In errorTracker.ts - already implemented in Phase 6
// Errors automatically logged to database
```

### 3. Set Up Dashboards

**Supabase Dashboard:**
- Monitor → Functions → Logs
- Monitor → Database → Query Performance
- Realtime → Subscriptions

**Internal Dashboard (from Phase 6):**
- Access in-app notification monitor
- View delivery metrics
- Check job execution health

### 4. Configure Alerting

**Email Alerts:**
```bash
# In Supabase Project Settings → Alerts
# Configure for:
# - Database size > 80%
# - API errors > 1% of requests
# - Function invocation failures
```

**Slack Integration (Optional):**
```typescript
// In errorTracker.ts
const sendAlert = async (message: string) => {
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Notification Alert: ${message}`,
      channel: '#alerts',
    }),
  });
};
```

---

## 🔄 Rollback Procedures

### Scenario 1: Critical Bug in Production

```bash
# 1. Identify issue
# Check Sentry or notification_errors table

# 2. Option A: Rollback Edge Functions
# Go to Supabase Dashboard → Functions
# Click on affected function → View previous deployments
# Deploy previous version

# 3. Option B: Rollback Mobile App
eas update --group production --branch rollback
# Or revert to previous app build

# 4. Verify fix
# Monitor error rate
# Check notification delivery
# Monitor user feedback
```

### Scenario 2: Database Corruption

```bash
# 1. Stop all services
# 2. Restore from backup
supabase db pull (from backup)

# 3. Run schema migration again
# 4. Restore user data if needed

# 5. Restart services
# 6. Verify data integrity
```

### Scenario 3: Overwhelming Queue Buildup

```sql
-- If notification queue gets huge:

-- Check status
SELECT status, COUNT(*) as count
FROM notification_queue
GROUP BY status;

-- If mostly failed, investigate why
SELECT DISTINCT error_message
FROM notification_log
WHERE status = 'failed'
AND sent_at > NOW() - INTERVAL '1 hour'
LIMIT 10;

-- Manually clear old failed notifications (if confirmed safe):
DELETE FROM notification_queue
WHERE status = 'failed'
AND created_at < NOW() - INTERVAL '7 days'
RETURNING count(*);
```

---

## 📅 Maintenance Schedule

### Daily Tasks
```
8:00 AM UTC:
- Check error rate in Sentry/Dashboard
- Monitor notification delivery rate
- Verify CRON jobs executed

5:00 PM UTC:
- Review job execution logs
- Check for any critical alerts
- Quick health check
```

### Weekly Tasks
```
Monday 8:00 AM UTC:
- Generate weekly performance report
- Review user feedback on notifications
- Check if any patterns in failures
- Review and close resolved issues
```

### Monthly Tasks
```
1st of month 8:00 AM UTC:
- Detailed performance analysis
- User engagement metrics
- System capacity planning
- Plan any improvements for next month

15th of month:
- Database optimization (ANALYZE, VACUUM)
- Review and archive old logs
- Update documentation based on learnings
```

### Quarterly Tasks
```
Every 3 months:
- Load testing with current user base
- Security audit
- Dependency updates
- Performance optimization review
- Team training/knowledge update
```

---

## 📋 Runbook Examples

### Issue: Notifications Not Sending

```
SYMPTOM: Users report not receiving notifications

DIAGNOSIS STEPS:
1. Check notification_queue
   SELECT COUNT(*) as pending
   FROM notification_queue
   WHERE status = 'pending'
   AND scheduled_for < NOW();

2. Check Edge Function logs
   Supabase → Functions → process-queue → Logs

3. Check delivery errors
   SELECT error_message, COUNT(*)
   FROM notification_log
   WHERE status = 'failed'
   AND sent_at > NOW() - INTERVAL '1 hour'
   GROUP BY error_message;

COMMON FIXES:
- If pending count high: Manually invoke process-queue
- If auth error: Check Edge Function API keys
- If Expo error: Check Expo project credentials
- If DB error: Check database connection

ESCALATION: If not resolved in 15 min, page on-call
```

### Issue: High Latency/Timeout

```
SYMPTOM: Notifications delayed or timing out

DIAGNOSIS:
1. Check database query performance
2. Check Edge Function duration
3. Monitor Supabase connections

FIXES:
- Reduce batch size in process-queue
- Increase Edge Function timeout
- Add database indexes
- Scale database if needed

PREVENTION:
- Monitor trends proactively
- Set up alerts at 80% thresholds
- Load test regularly
```

### Issue: Out of Memory

```
SYMPTOM: App crashes during notification processing

DIAGNOSIS:
1. Check app logs for memory errors
2. Monitor heap usage
3. Profile memory with React DevTools

FIXES:
- Clear old notification logs more frequently
- Process smaller batches
- Unsubscribe from unused Realtime channels
- Check for memory leaks in listeners

PREVENTION:
- Implement memory budgets
- Regular memory profiling
- Load testing
```

---

## 📞 Support & Escalation

### Severity Levels

```
CRITICAL (1 hour SLA):
- No notifications sending at all
- Database completely down
- Security breach

HIGH (4 hour SLA):
- Some notification types failing
- > 10% notification failure rate
- Performance degraded > 50%

MEDIUM (8 hour SLA):
- Minor bugs in preferences
- Edge cases causing issues
- Minor performance issues

LOW (24 hour SLA):
- UI/UX improvements
- Documentation updates
- Nice-to-have features
```

### Escalation Path

```
User Reports Issue
       ↓
Level 1: Read runbook, basic diagnosis
       ↓
If not resolved in 15 min:
Level 2: Page on-call engineer
       ↓
If not resolved in 30 min:
Level 3: Escalate to team lead
       ↓
If critical and ongoing:
Level 4: Rollback plan activation
```

---

## 📚 Documentation for Teams

### Developer Guide
- Architecture overview
- Code walkthroughs
- How to add new notification types
- Testing procedures

### Operations Guide
- Deployment procedures
- Monitoring dashboard usage
- Runbooks for common issues
- Emergency procedures

### Product Guide
- Feature overview for PMs
- User engagement metrics
- Roadmap for improvements
- Feedback collection process

---

## ✅ Post-Launch Tasks (First Week)

- [ ] Monitor dashboard daily
- [ ] Collect user feedback
- [ ] Fix critical bugs immediately
- [ ] Document any learnings
- [ ] Celebrate launch! 🎉

---

## 🎯 Success Metrics

**Technical:**
- ✅ 99.5%+ notification delivery rate
- ✅ < 1 second delivery when app open
- ✅ < 5 minute delivery when app closed
- ✅ Zero critical bugs in week 1
- ✅ < 0.1% duplicate rate

**Business:**
- ✅ > 80% users with notifications enabled
- ✅ > 50% notification open rate
- ✅ > 90% user satisfaction
- ✅ Increase in daily active users (from improved reminders)

**Operational:**
- ✅ 99.9% system uptime
- ✅ < 50ms p95 latency
- ✅ Zero unplanned downtime
- ✅ All runbooks followed
- ✅ Team confident in operations

---

## 🎓 Team Handoff

**Documentation Provided:**
- [ ] Architecture guide
- [ ] Code documentation
- [ ] Runbooks (10+ common scenarios)
- [ ] Monitoring guide
- [ ] Deployment procedures
- [ ] Emergency procedures

**Training Completed:**
- [ ] On-call engineers trained
- [ ] Support team trained
- [ ] Product team trained
- [ ] Monitoring dashboard demo
- [ ] Escalation procedures reviewed

**Knowledge Transfer:**
- [ ] Code walkthroughs done
- [ ] Q&A sessions completed
- [ ] Documentation review
- [ ] Shadow period completed
- [ ] Sign-off from team

---

**Phase 8 Status:** Complete Notification System Deployed! 🚀

Your BudgetZen notification system is now live and monitored!

---

## Quick Links for Production

| Resource | Purpose |
|----------|---------|
| Supabase Dashboard | Monitor database & functions |
| App Monitoring | In-app notification metrics |
| Runbooks | How to handle issues |
| Escalation | Who to contact |
| Documentation | Reference guides |
| Feedback | User issues & requests |

**Launch Date:** [Deployment Date]  
**On-Call: [Team Member Name]**  
**Escalation: [Manager/Lead Name]**  

🎉 **System Live & Operating** 🎉
