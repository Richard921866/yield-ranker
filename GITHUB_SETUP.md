# GitHub Actions Setup - Daily 8pm EST Update

## What This Does Automatically

Every day at 8pm EST (after market close), the workflow will:
1. Pull latest price data from Tiingo API
2. Pull latest dividend data from Tiingo API
3. Recalculate ALL metrics (annual dividend, DVI, returns, etc.)
4. Update rankings
5. Update charts automatically (data is refreshed in database)

**You do NOT need to manually run this every day** - it runs automatically!

## One-Time Setup (Do This Once)

### Step 1: Enable GitHub Actions
1. Go to your GitHub repository
2. Click **Settings** (top right)
3. Click **Actions** → **General** (left sidebar)
4. Under "Workflow permissions", select **"Read and write permissions"**
5. Check **"Allow GitHub Actions to create and approve pull requests"**
6. Click **Save**

### Step 2: Set Up Secrets (Required)
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of these:

   **Secret 1: SUPABASE_URL**
   - Name: `SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)

   **Secret 2: SUPABASE_SERVICE_ROLE_KEY**
   - Name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your Supabase service role key (found in Supabase dashboard → Settings → API)

   **Secret 3: TIINGO_API_KEY**
   - Name: `TIINGO_API_KEY`
   - Value: Your Tiingo API key

4. Click **Add secret** for each one

### Step 3: Verify Workflow File Exists
- The file `.github/workflows/daily-update.yml` should already exist in your repo
- If it's not there, make sure it's committed and pushed to GitHub

## That's It!

Once you complete the setup above, the workflow will:
- **Automatically run every day at 8pm EST** (no action needed from you)
- Pull fresh data from Tiingo
- Recalculate all metrics
- Update your charts automatically

## Manual Trigger (Optional)

If you want to run it manually before 8pm or test it:

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **Daily ETF Data Update** in the left sidebar
4. Click **Run workflow** button (top right)
5. Optionally:
   - Check "Force" to resync last 60 days
   - Enter a ticker to update just one ETF
6. Click **Run workflow**

## How to Check If It's Working

1. Go to **Actions** tab in GitHub
2. You should see "Daily ETF Data Update" workflow runs
3. Click on a run to see logs
4. Green checkmark = success
5. Red X = failure (check logs for errors)

## Troubleshooting

**Workflow not running?**
- Check that Actions are enabled (Step 1 above)
- Check that secrets are set (Step 2 above)
- Check Actions tab for any error messages

**Workflow failing?**
- Check the logs in the Actions tab
- Verify all 3 secrets are set correctly
- Make sure your Tiingo API key is valid and has credits

**Want to change the time?**
- Edit `.github/workflows/daily-update.yml`
- Change the cron schedule (times are in UTC)
- 8pm EST = 1am UTC (Nov-Mar) or 0am UTC (Mar-Nov)

## What Gets Updated

When the workflow runs, it updates:
- ✅ Latest prices from Tiingo
- ✅ Latest dividends from Tiingo
- ✅ Annual dividend calculations
- ✅ DVI (Dividend Volatility Index)
- ✅ All return metrics (1W, 1M, 3M, 6M, 1Y, 3Y)
- ✅ Rankings
- ✅ Charts (automatically reflect new data)

All of this happens automatically - your CEO will see fresh data every morning!

