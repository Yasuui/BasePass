# GitHub Setup Guide for BasePass

This guide will walk you through setting up your BasePass project on GitHub for hackathon submission.

## 📋 Prerequisites

- Git installed on your computer
- GitHub account created
- Your BasePass code ready

## 🚀 Step-by-Step GitHub Setup

### 1. Create a New Repository on GitHub

1. **Go to GitHub.com** and log in
2. **Click the "+" icon** in the top right corner
3. **Select "New repository"**
4. **Configure your repository**:
   - **Repository name**: `BasePass` (or `BassPass` if you prefer)
   - **Description**: "Onchain event passport system with verifiable attendance stamps - Built on Base Network"
   - **Visibility**: Choose "Public" (required for open-source hackathon submission)
   - **Initialize repository**: 
     - ❌ Do NOT check "Add a README file" (we already have one)
     - ❌ Do NOT add .gitignore (we already have one)
     - ❌ Do NOT choose a license (we already have one)
5. **Click "Create repository"**

### 2. Connect Your Local Code to GitHub

Open your terminal in the BasePass project directory and run:

```bash
# Navigate to your project directory
cd C:\Users\Yonis\Desktop\OnChain

# Initialize git if not already done
git init

# Add all files to staging
git add .

# Create your first commit
git commit -m "Initial commit: BasePass hackathon project"

# Add your GitHub repository as remote origin
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/BasePass.git

# Verify remote was added
git remote -v

# Push your code to GitHub
git branch -M main
git push -u origin main
```

### 3. Verify Your Upload

1. **Refresh your GitHub repository page**
2. **Check that all files are present**:
   - ✅ contracts/
   - ✅ scripts/
   - ✅ test/
   - ✅ frontend/
   - ✅ README.md
   - ✅ CONTRIBUTING.md
   - ✅ LICENSE
   - ✅ hardhat.config.ts
   - ✅ package.json

3. **Verify .gitignore is working** (these should NOT be uploaded):
   - ❌ node_modules/
   - ❌ .env
   - ❌ cache/
   - ❌ artifacts/

### 4. Enhance Your GitHub Repository

#### Add Repository Topics

1. Go to your repository page
2. Click the gear icon ⚙️ next to "About"
3. Add topics:
   - `blockchain`
   - `ethereum`
   - `base-network`
   - `nft`
   - `solidity`
   - `hardhat`
   - `nextjs`
   - `web3`
   - `hackathon`
   - `proof-of-attendance`

#### Update Repository Settings

1. Go to **Settings** tab
2. Scroll to **Features** section
3. Enable:
   - ✅ Issues (for bug reports)
   - ✅ Discussions (for community engagement)

#### Create a .env.example File

Create a template for environment variables:

```bash
# In your project directory
echo "# BasePass Environment Variables
# Copy this file to .env and fill in your values

# Network Configuration
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key_here_without_0x_prefix

# Frontend Configuration (if needed)
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
NEXT_PUBLIC_CHAIN_ID=84532" > .env.example

# Add and commit
git add .env.example
git commit -m "docs: add environment variable template"
git push
```

### 5. Create a GitHub Release (Optional but Recommended)

1. Go to your repository page
2. Click on "Releases" in the right sidebar
3. Click "Create a new release"
4. Fill in:
   - **Tag version**: `v1.0.0`
   - **Release title**: "BasePass v1.0.0 - Hackathon Submission"
   - **Description**: Summarize your project and key features
5. Click "Publish release"

### 6. Add Project Documentation

#### Update README with Deployment Info

After deploying your contract, update the README:

```bash
# Edit README.md and replace placeholders:
# - [Contract Address on Base Sepolia] -> Your actual contract address
# - [Deployment URL] -> Your frontend URL (if deployed)
# - [Video Link] -> Link to demo video
# - [@YourUsername] -> Your GitHub username
# - etc.

git add README.md
git commit -m "docs: update deployment information"
git push
```

### 7. Submission Checklist

Before submitting to the hackathon, verify:

- ✅ All code is pushed to GitHub
- ✅ Repository is public
- ✅ README is complete and informative
- ✅ LICENSE file is present (MIT)
- ✅ CONTRIBUTING.md is included
- ✅ Code is well-commented
- ✅ Tests are included and passing
- ✅ .env.example is provided (not .env!)
- ✅ Smart contract is deployed to testnet
- ✅ Contract address is in README
- ✅ Repository has relevant topics/tags
- ✅ No sensitive information (private keys, API keys) in repo

## 🔒 Security Reminder

**IMPORTANT**: Before pushing to GitHub:

```bash
# Double-check your .env is in .gitignore
cat .gitignore | grep ".env"

# Verify .env is not tracked by git
git status

# If .env appears in git status, it's NOT ignored!
# Make sure .gitignore contains ".env" on its own line
```

If you accidentally committed sensitive information:

```bash
# Remove from git but keep locally
git rm --cached .env

# Commit the change
git commit -m "fix: remove .env from git tracking"

# Push
git push

# ⚠️ IMPORTANT: The data is still in git history!
# Change any exposed keys immediately!
# For complete removal, use tools like git-filter-repo
```

## 📝 Git Best Practices

### Useful Git Commands

```bash
# Check status of your files
git status

# See what changed
git diff

# View commit history
git log --oneline

# Create a new branch for features
git checkout -b feature/new-feature

# Switch back to main
git checkout main

# Pull latest changes (if collaborating)
git pull origin main
```

### Commit Message Guidelines

Follow conventional commits:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in contract"
git commit -m "docs: update README"
git commit -m "test: add unit tests"
git commit -m "refactor: improve code structure"
```

## 🎯 Hackathon-Specific Tips

1. **Clear README**: Make sure judges can understand your project in 2 minutes
2. **Live Demo**: Deploy your contract and frontend (if possible)
3. **Video Demo**: Create a short video showing functionality
4. **Documentation**: More is better - show your thought process
5. **Tests**: Include comprehensive tests to show code quality
6. **Comments**: Well-commented code shows professionalism

## 🐛 Troubleshooting

### "Repository not found" Error

```bash
# Check your remote URL
git remote -v

# Update it if wrong
git remote set-url origin https://github.com/YOUR_USERNAME/BasePass.git
```

### "Permission denied" Error

```bash
# Use HTTPS instead of SSH, or set up SSH keys
# HTTPS URL format:
git remote set-url origin https://github.com/YOUR_USERNAME/BasePass.git
```

### Large Files Error

```bash
# If you get errors about large files:
# Make sure node_modules/ is in .gitignore
# Remove it from git if already tracked:
git rm -r --cached node_modules/
git commit -m "fix: remove node_modules from tracking"
```

### Files Not Updating on GitHub

```bash
# Make sure you've pushed
git push origin main

# If that fails, check your branch
git branch  # Should show * main

# Force push (use carefully!)
git push -f origin main
```

## 🎉 You're All Set!

Your BasePass project is now on GitHub and ready for hackathon submission!

### Final Steps

1. **Copy your repository URL**: `https://github.com/YOUR_USERNAME/BasePass`
2. **Submit to hackathon**: Paste the URL in the submission form
3. **Share on social media**: Tweet about your project!
4. **Wait for results**: Good luck! 🍀

---

Need help? Check:
- [GitHub Docs](https://docs.github.com)
- [Git Documentation](https://git-scm.com/doc)
- [BasePass Discussions](https://github.com/YOUR_USERNAME/BasePass/discussions)

