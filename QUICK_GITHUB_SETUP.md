# Quick GitHub Setup - TL;DR Version

**Goal**: Get your BasePass code on GitHub in under 5 minutes.

## 🚀 Fast Track

### Step 1: Create GitHub Repo (2 minutes)

1. Go to https://github.com/new
2. **Name**: `BasePass` (or `BassPass`)
3. **Description**: "Onchain event passport system - Built on Base Network"
4. **Public** repository ✅
5. **Don't** initialize with README, .gitignore, or license ❌
6. Click **Create repository**

### Step 2: Upload Your Code (3 minutes)

Open terminal in your project folder:

```bash
cd C:\Users\Yonis\Desktop\OnChain

git init
git add .
git commit -m "Initial commit: BasePass hackathon submission"
git remote add origin https://github.com/YOUR_USERNAME/BasePass.git
git branch -M main
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

### Step 3: Verify (1 minute)

1. Refresh your GitHub page
2. Check all files are there
3. Check `.env` is **NOT** there (security!)

## ✅ Done!

Your repository URL is: `https://github.com/YOUR_USERNAME/BasePass`

Use this URL for your hackathon submission.

---

## 🎨 Optional Enhancements (5 more minutes)

### Add Topics to Repository

Click ⚙️ next to "About" on GitHub, add:
- `blockchain` `ethereum` `base-network` `nft` `solidity` `hackathon`

### Update Placeholders in README

Edit on GitHub or locally:
- Replace `[Your Name]` with your actual name
- Replace `[@YourUsername]` with your GitHub handle
- Replace `[Contract Address]` after deployment

```bash
# After editing locally:
git add README.md
git commit -m "docs: personalize README"
git push
```

---

## 🆘 Quick Troubleshooting

**"Fatal: not a git repository"**
```bash
git init
```

**"Remote already exists"**
```bash
git remote set-url origin https://github.com/YOUR_USERNAME/BasePass.git
```

**"Permission denied"**
- Make sure you're logged into GitHub
- Use HTTPS URL (not SSH) if you haven't set up SSH keys

**".env file is showing in git"**
```bash
# Make sure .gitignore exists and contains ".env"
echo ".env" >> .gitignore
git rm --cached .env
git commit -m "fix: remove .env from tracking"
git push
```

---

## 📋 Submission Checklist

- ✅ Code on GitHub
- ✅ Repository is **Public**
- ✅ README has project description
- ✅ LICENSE file exists
- ✅ No `.env` file in repo
- ✅ Tests are included
- ✅ Code has comments

---

**Need more details?** See [GITHUB_SETUP.md](GITHUB_SETUP.md)

