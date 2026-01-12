# FTC Scout 22351 🤖

A Progressive Web App (PWA) for scouting FTC robotics competitions. Built for Team 22351, this app allows teams to submit match data and access analytics from any device - online or offline.

## ✨ Features

- **📱 Progressive Web App**: Install on iOS and Android devices
- **🔄 Offline Support**: Submit data without internet, auto-syncs when online
- **📊 Data Management**: View, filter, and export scouting data
- **🎨 Modern UI**: Dark theme optimized for competition environments
- **📈 Real-time Analytics**: Track team performance across matches
- **💾 CSV/JSON Export**: Export data for further analysis

## 🚀 Quick Start

### Step 1: Install Node.js

**Windows Installation:**
1. Download Node.js from [nodejs.org](https://nodejs.org/)
   - Choose the "LTS" (Long Term Support) version
   - Download the Windows Installer (.msi) for your system (64-bit recommended)
2. Run the installer
   - Accept the license agreement
   - Keep default installation location
   - **Important:** Check the box "Automatically install necessary tools"
3. Restart your computer
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Install Dependencies

1. **Open PowerShell in the project folder**
   - Right-click the FTCSCOUT folder
   - Select "Open in Terminal" or "Open PowerShell window here"

2. **Install dependencies**
   ```bash
   npm install
   ```

### Step 3: Start the Server

```bash
npm start
```

### Step 4: Access the App

Open your browser and go to `http://localhost:3000`

**Default View Password:** `22351` (your team number)
**Default Dev Password:** `dev22351admin` (change this immediately!)

## 🔐 Password System

The app has **two levels of access**:

1. **View Access** (password: `22351`)
   - See all submitted data
   - Filter and search entries
   - Export CSV/JSON

2. **Developer Access** (password: `dev22351admin`)
   - Everything in View Access
   - Statistics dashboard
   - Delete individual entries
   - Clear all data
   - Data backup/export

**⚠️ IMPORTANT:** Change both passwords before deployment!

### Development Mode

For auto-restart on file changes:
```bash
npm run dev
```

## 📱 Installing as PWA

### On Android
1. Open the app in Chrome
2. Tap the menu (⋮) and select "Install app" or "Add to Home Screen"
3. The app will now work offline!

### On iOS
1. Open the app in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will now work offline!

## 📋 Usage

### Submitting Data

1. Click **Submit Data** from the home screen
2. Fill in match information:
   - Your team number (default: 22351)
   - Scout name
   - Match number
   - Team being scouted
   - Alliance color

3. Record performance data:
   - **Autonomous**: Movement, samples, specimens
   - **Teleop**: Samples, specimens, defense
   - **End Game**: Climb status, parking
   - **Notes**: Speed rating and observations

4. Click **Submit Data**
   - If online, data is saved immediately
   - If offline, data is stored locally and synced later

### Viewing Data

1. Click **View Data** from the home screen
2. **Enter password** (default: `22351`)
   - ⚠️ **Change this in production!** Set the `VIEW_PASSWORD` environment variable
3. Use filters to search:
   - Search by team number
   - Filter by match
4. Export data:
   - **CSV** for spreadsheet analysis
   - **JSON** for custom tools

### Security Notes

- The view page is **password protected**
- Default password is `22351` (your team number)
- **For deployment:** Set a secure password using the `VIEW_PASSWORD` environment variable
- Anyone can submit data (submit.html is public)
- Only authenticated users can view data

## 🗂️ Project Structure

```
FTCSCOUT/
├── public/              # Frontend files
│   ├── index.html       # Home page
│   ├── submit.html      # Data entry form
│   ├── view.html        # Data viewing page
│   ├── manifest.json    # PWA manifest
│   ├── service-worker.js # Offline functionality
│   ├── css/
│   │   └── style.css    # Styles
│   ├── js/
│   │   ├── app.js       # Main app logic
│   │   ├── submit.js    # Form handling
│   │   └── view.js      # Data display
│   └── icons/           # PWA icons (add your own)
├── data/
│   └── submissions.json # Stored scouting data
├── server.js            # Express backend
├── package.json         # Dependencies
└── README.md            # This file
```

## 🌐 Deployment

### Deploy to Render (Recommended - Free)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/ftcscout.git
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name:** `ftcscout-22351`
     - **Environment:** `Node`
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
   - Add Environment Variable:
     - **Key:** `VIEW_PASSWORD`
     - **Value:** Your secure password (change from default!)
   - Click "Create Web Service"
   - Your app will be live at `https://ftcscout-22351.onrender.com`

### Deploy to Railway (Alternative - Free Tier)

1. **Push to GitHub** (same as above)

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app) and sign up
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects settings
   - Add Environment Variable:
     - `VIEW_PASSWORD` = your password
   - Click "Deploy"
   - Get your URL from the "Settings" tab

### Deploy to Vercel (Serverless)

**Note:** Vercel works best for static sites. For this app with data persistence, Render or Railway is better.

### Post-Deployment Steps

1. **Test the deployment**
   - Visit your deployed URL
   - Try submitting data
   - Test the view page with your password

2. **Share with teams**
   - Submit page: `https://your-app.onrender.com/submit.html`
   - View page (your team only): `https://your-app.onrender.com/view.html`

3. **Update the README with your URL**

## 🎨 Customization

### Team Branding

Edit colors in [public/css/style.css](public/css/style.css):
```css
:root {
    --primary-color: #0f3460;    /* Your team color */
    --accent-color: #e94560;     /* Accent color */
    --background: #1a1a2e;       /* Background */
}
```

### Icons

Replace placeholder icons in `public/icons/` with your team logo:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

Generate PWA icons at [realfavicongenerator.net](https://realfavicongenerator.net/)

### Form Fields

Customize scouting fields in [public/submit.html](public/submit.html) to match the current season's game.

## 🔧 API Endpoints

- `POST /api/submit` - Submit new scouting data
- `GET /api/data` - Get all submissions
- `GET /api/data/team/:teamNumber` - Get data for specific team
- `GET /api/data/match/:matchNumber` - Get data for specific match
- `DELETE /api/data/:id` - Delete specific entry
- `GET /api/health` - Health check

## 🤝 Contributing

Feel free to fork and customize for your team! Some ideas:
- Add photo upload for robot mechanisms
- Implement team comparison charts
- Add pit scouting features
- Create match strategy predictions

## 📄 License

MIT License - feel free to use and modify for your FTC team!

## 🆘 Support

For issues or questions:
- Check the browser console for errors
- Ensure Node.js and dependencies are properly installed
- Verify the data directory exists and is writable

## 🏆 Credits

Built for FTC Team 22351
Season 2025-2026

---

**Good luck at competition!** 🤖⚙️
