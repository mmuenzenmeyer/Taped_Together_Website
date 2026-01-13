# 🔥 Firebase Setup Guide - Team 22351

## Step 1: Create Firebase Project (5 minutes)

1. Go to https://console.firebase.google.com/
2. Click **"Add project"**
3. Project name: `ftc-scout-22351` (or your choice)
4. Click **Continue**
5. Disable Google Analytics (optional, not needed)
6. Click **Create project**

## Step 2: Set Up Firestore Database (2 minutes)

1. In Firebase Console, click **"Firestore Database"** in left menu
2. Click **"Create database"**
3. Select **"Start in production mode"**
4. Choose location: `us-central` (or closest to your region)
5. Click **"Enable"**

### Update Security Rules (Important!)

In Firestore → Rules tab, paste this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write to match-data and pit-data collections
    match /{collection}/{document=**} {
      allow read, write: if true;
    }
  }
}
```

Click **"Publish"**

⚠️ **Note:** These rules allow anyone to read/write. For production, you should add authentication.

## Step 3: Generate Service Account Key (3 minutes)

1. Click **⚙️ Settings** icon → **"Project settings"**
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"**
5. Save the JSON file (it will auto-download)

**Keep this file SECRET! Never commit to GitHub!**

## Step 4: Configure Environment Variables

You need to set these environment variables on Render (or your hosting platform):

### Method A: Using the JSON file directly

Copy the entire contents of your service account JSON file and set:

```bash
FIREBASE_ENABLED=true
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project",...}
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### Method B: Individual values (Alternative)

Or extract individual values from the JSON:

```bash
FIREBASE_ENABLED=true
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYour key here...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

## Step 5: Add Environment Variables to Render

1. Go to your Render dashboard: https://dashboard.render.com/
2. Click on your web service
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add each variable:

| Key | Value |
|-----|-------|
| `FIREBASE_ENABLED` | `true` |
| `FIREBASE_SERVICE_ACCOUNT` | Paste entire JSON from downloaded file |
| `FIREBASE_DATABASE_URL` | `https://your-project.firebaseio.com` |
| `VIEW_PASSWORD` | `22351` |
| `DEV_PASSWORD` | `dev22351admin` |

6. Click **"Save Changes"**
7. Render will automatically redeploy with Firebase enabled!

## Step 6: Test Firebase Connection

1. After Render redeploys, check the logs
2. Look for: `🔥 Firebase connected successfully!`
3. Submit a test scout form
4. Go to Firebase Console → Firestore Database
5. You should see:
   - `match-data` collection
   - `pit-data` collection
   - Your test entries inside

## 🎯 What Firebase Does for You

- ✅ **Permanent storage** - Data never gets deleted
- ✅ **Real-time sync** - All devices see updates instantly
- ✅ **Backup** - Still saves to local JSON files as backup
- ✅ **Scalable** - Handles thousands of entries
- ✅ **Free tier** - 1GB storage, 50K reads/day, 20K writes/day

## 🔒 Security Best Practices

1. **Never commit service account JSON to GitHub**
   - Add `*-firebase-*.json` to `.gitignore`
   
2. **Use environment variables only**
   - Store secrets in Render's environment settings
   
3. **Update Firestore rules** (after competition):
   ```
   match /{collection}/{document=**} {
     allow read: if true;
     allow write: if request.auth != null;
   }
   ```

4. **Rotate keys annually**
   - Delete old service accounts in Firebase Console

## 🆘 Troubleshooting

### Error: "Firebase initialization failed"
- Check that `FIREBASE_SERVICE_ACCOUNT` is valid JSON
- Verify `FIREBASE_ENABLED=true` (not `"true"`)
- Check Render logs for specific error message

### Error: "Missing or insufficient permissions"
- Update Firestore security rules (see Step 2)
- Make sure rules are published

### Data not syncing to Firebase
- Check `FIREBASE_ENABLED` is set to `true`
- Look for Firebase errors in Render logs
- Verify service account has Firestore access

### App works locally but not on Render
- Environment variables must be set in Render dashboard
- Don't use `.env` file for production (won't deploy)
- Check Render logs for connection errors

## 📊 Monitoring Firebase Usage

1. Go to Firebase Console
2. Click **"Usage and billing"**
3. See your free tier limits:
   - Storage: 1 GB
   - Reads: 50K/day
   - Writes: 20K/day
   - Deletes: 20K/day

For a competition, you'll use:
- ~1000 entries × 2KB = 2MB storage (0.2% of limit)
- ~10K reads during competition (20% of limit)

**You're well within free tier! 🎉**

## ✅ Success Checklist

- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Security rules published
- [ ] Service account JSON downloaded
- [ ] Environment variables added to Render
- [ ] App redeployed on Render
- [ ] Logs show "Firebase connected"
- [ ] Test data appears in Firestore Console
- [ ] Dashboard loads data correctly

## 🚀 Next Steps

Once Firebase is working:
1. Test submitting from multiple devices
2. Verify data appears in dashboard
3. Check Firestore Console to see entries
4. Optional: Set up Firebase authentication for extra security
5. Optional: Enable Firebase Analytics for usage stats

**You're now running a professional cloud-based scouting system! 🎯**
