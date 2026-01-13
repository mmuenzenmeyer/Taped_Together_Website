# 🎥 YouTube Auto-Loader Setup Guide

Your website is now configured to **automatically load your latest YouTube videos** as soon as you publish them. No manual updates needed!

## 🚀 Quick Setup (5 minutes)

### Step 1: Get YouTube Data API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. **Create a new project:**
   - Click "Select a project" at the top
   - Click "New Project"
   - Name: `FTC Team 22351 Website` (or your choice)
   - Click "Create"

3. **Enable YouTube Data API v3:**
   - Click "Enable APIs and Services" button
   - Search for "YouTube Data API v3"
   - Click on it → Click "Enable"

4. **Create API Key:**
   - Go to "Credentials" tab on the left
   - Click "Create Credentials" → "API Key"
   - Copy the API key (it looks like: `AIzaSyDaGmWU0g4ZZ1234567890abcdefghijk`)
   - Click "Restrict Key" (recommended for security)
   - Under "API restrictions" → Select "Restrict key"
   - Check only "YouTube Data API v3"
   - Click "Save"

### Step 2: Get Your YouTube Channel ID

1. Go to your YouTube channel: [@tapedtogetherrobotics](https://www.youtube.com/@tapedtogetherrobotics)
2. Click the **"About"** tab
3. Click **"Share"** button
4. Click **"Copy channel ID"**
   - It looks like: `UCqWVfHfqLcA9TpzF4nRdQWg`

### Step 3: Update Configuration in home.html

Open `public/home.html` and find this section (around line 427):

```javascript
const YOUTUBE_CONFIG = {
    apiKey: 'YOUR_API_KEY_HERE',  // Replace with your API key
    channelId: 'UCqWVfHfqLcA9TpzF4nRdQWg',  // Already set to tapedtogetherrobotics
    maxVideos: 8  // Number of videos to show
};
```

Replace `YOUR_API_KEY_HERE` with your actual API key:

```javascript
const YOUTUBE_CONFIG = {
    apiKey: 'AIzaSyDaGmWU0g4ZZ1234567890abcdefghijk',  // Your real key
    channelId: 'UCqWVfHfqLcA9TpzF4nRdQWg',
    maxVideos: 8
};
```

**Save the file** and refresh your website!

## ✅ Testing

1. Visit http://localhost:3000
2. Click the **🎥 Videos** tab
3. You should see your latest 8 YouTube videos automatically loaded!

## 🎯 How It Works

- **Automatic updates:** When you publish a new video on YouTube, it appears on your website within seconds
- **No manual work:** Never edit video IDs again
- **Latest first:** Most recent videos show first
- **Fast loading:** Videos load only when someone clicks the Videos tab

## 🔐 Security Notes

### Free Tier Limits
- YouTube Data API v3 free tier: **10,000 quota units per day**
- Loading 8 videos = ~9 quota units
- Your website can handle **1,000+ visitors per day** without hitting limits

### Protecting Your API Key (Important!)

Your API key is in the HTML, which means visitors can see it. This is okay for:
- ✅ Free tier usage
- ✅ Read-only operations (searching videos)
- ✅ Small websites/teams

To secure it better (optional):

#### Option A: Use API Key Restrictions (Recommended)
In Google Cloud Console:
1. Go to Credentials → Your API Key → Edit
2. Under "Website restrictions":
   - Choose "HTTP referrers"
   - Add: `https://your-website.com/*` (your actual domain)
   - Add: `http://localhost:3000/*` (for testing)
3. Click "Save"

Now the key only works from your website!

#### Option B: Move to Backend (Advanced)
Create a server endpoint:

```javascript
// In server.js
app.get('/api/youtube-videos', async (req, res) => {
    const apiKey = process.env.YOUTUBE_API_KEY;  // Store in environment variable
    const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=...`
    );
    const data = await response.json();
    res.json(data);
});
```

Then update home.html to call your server instead of YouTube directly.

## 📊 Customization

### Change Number of Videos
```javascript
maxVideos: 12  // Show 12 videos instead of 8
```

### Filter by Playlist
Want to show only videos from a specific playlist?

```javascript
const YOUTUBE_CONFIG = {
    apiKey: 'YOUR_API_KEY',
    playlistId: 'PLxxxxxxxxxxxxxxxxxxxxxx',  // Instead of channelId
    maxVideos: 8
};
```

Then update the fetch URL in the code to use `playlistItems` instead of `search`.

### Show Specific Videos
If you want specific videos (not auto-loaded), replace the JavaScript with static video IDs:

```javascript
const FEATURED_VIDEOS = [
    { id: 'dQw4w9WgXcQ', title: 'Robot Reveal', description: 'Our season robot!' },
    { id: 'abc123XYZ', title: 'Tournament', description: 'Competition highlights' }
];
```

## 🆘 Troubleshooting

### "YouTube API Not Configured" message
- Make sure you replaced `YOUR_API_KEY_HERE` with your actual key
- Check that you saved the file
- Hard refresh: Ctrl+Shift+R

### "Error Loading Videos"
- **API key invalid:** Double-check you copied the entire key
- **API not enabled:** Make sure YouTube Data API v3 is enabled in Google Cloud
- **Quota exceeded:** Check quota usage in Google Cloud Console
- **Wrong channel ID:** Verify the channel ID is correct

### Videos not updating
- **Cache issue:** Hard refresh (Ctrl+Shift+R)
- **Check YouTube:** Make sure videos are public (not private/unlisted)

### "403 Forbidden" error
- API key restrictions are blocking your domain
- Add your domain to "HTTP referrers" in API key settings

## 📈 Monitoring Usage

Check your API usage:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Dashboard"
4. Click "YouTube Data API v3"
5. See quota usage graph

## 🎉 Success!

Your website now automatically shows your latest YouTube content. Every time you:
- Upload a new video → It appears on your site
- Make a video private → It disappears from your site
- Update video title → It updates on your site

**No manual updates needed ever again!** 🚀

---

**Need help?** Check the browser console (F12) for detailed error messages.
