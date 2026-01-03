# GitHub Repository Setup Guide for HRMS

## 📋 Step-by-Step Guide to Create Private GitHub Repository

### Step 1: Initialize Git Repository Locally

Open PowerShell in HRMS folder and run:

```powershell
cd "c:\Users\TIRTH SHAH\Desktop\HRMS"

# Initialize git repository
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Complete HRMS system with all modules"
```

### Step 2: Create GitHub Repository

1. **Go to GitHub**
   - Open browser: https://github.com
   - Sign in to your account

2. **Create New Repository**
   - Click the "+" icon (top right)
   - Select "New repository"

3. **Configure Repository**
   - **Repository name**: `HRMS`
   - **Description**: `Human Resource Management System - Full-stack MERN application`
   - **Visibility**: ✅ Select **Private** ⭐
   - **DO NOT** initialize with README (we already have one)
   - **DO NOT** add .gitignore (we already have one)
   - Click "Create repository"

### Step 3: Connect Local to GitHub

After creating the repository, GitHub will show commands. Copy and run them:

```powershell
# Set the remote repository
git remote add origin https://github.com/YOUR_USERNAME/HRMS.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

### Step 4: Verify Upload

1. Refresh your GitHub repository page
2. You should see all files uploaded
3. Check that .env file is NOT uploaded (should be ignored)

---

## 🔐 Important Security Notes

### Files That Will NOT Be Uploaded (Good!)
- ✅ `.env` (contains secrets)
- ✅ `node_modules/` (dependencies)
- ✅ `uploads/*` (user files)
- ✅ `.vscode/` (IDE settings)

### Files That WILL Be Uploaded
- ✅ All source code
- ✅ `.env.example` (template, no secrets)
- ✅ Documentation files
- ✅ Configuration files

---

## 📝 Alternative: Using GitHub Desktop (Easier)

### Option A: GitHub Desktop (Recommended for Beginners)

1. **Download GitHub Desktop**
   - Go to: https://desktop.github.com
   - Install and sign in

2. **Add Repository**
   - File → Add local repository
   - Choose: `c:\Users\TIRTH SHAH\Desktop\HRMS`
   - Click "Add repository"

3. **Publish to GitHub**
   - Click "Publish repository"
   - Name: `HRMS`
   - Description: `Human Resource Management System`
   - ✅ Check **Keep this code private** ⭐
   - Click "Publish repository"

4. **Done!** Your repository is now on GitHub (private)

---

## 🚀 Quick Command Summary

```powershell
# Navigate to project
cd "c:\Users\TIRTH SHAH\Desktop\HRMS"

# Initialize Git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Complete HRMS system"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/HRMS.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🔧 Common Issues & Solutions

### Issue 1: Git not recognized
```powershell
# Install Git
# Download from: https://git-scm.com/download/win
```

### Issue 2: Authentication failed
```powershell
# Use Personal Access Token instead of password
# GitHub Settings → Developer settings → Personal access tokens
# Generate token and use as password
```

### Issue 3: Permission denied
```powershell
# Set up SSH key or use HTTPS with token
# Guide: https://docs.github.com/en/authentication
```

---

## 📊 Repository Settings (After Upload)

### Make Repository Private:
1. Go to repository on GitHub
2. Click "Settings"
3. Scroll to "Danger Zone"
4. Click "Change repository visibility"
5. Select "Make private"
6. Confirm

### Add Collaborators (Optional):
1. Go to "Settings" → "Collaborators"
2. Click "Add people"
3. Enter GitHub username or email
4. Select permission level

### Protect Main Branch:
1. Go to "Settings" → "Branches"
2. Add branch protection rule for "main"
3. Enable desired protections

---

## 📁 What Will Be in Your Repository

```
HRMS (Private Repository)
├── .gitignore              ✅ Uploaded
├── .env.example            ✅ Uploaded
├── .env                    ❌ NOT uploaded (ignored)
├── package.json            ✅ Uploaded
├── docker-compose.yml      ✅ Uploaded
├── README.md               ✅ Uploaded
├── SETUP_GUIDE.md          ✅ Uploaded
├── backend/                ✅ Uploaded (all files)
├── frontend/               ✅ Uploaded (all files)
├── node_modules/           ❌ NOT uploaded (ignored)
└── uploads/                ❌ NOT uploaded (ignored)
```

---

## ✅ Verification Checklist

After pushing to GitHub, verify:

- [ ] Repository is marked as **Private** 🔒
- [ ] All source code files are present
- [ ] `.env` file is NOT visible
- [ ] `node_modules/` is NOT visible
- [ ] README.md displays properly
- [ ] Can clone and run the project

---

## 🔄 Future Updates

To push changes to GitHub:

```powershell
# Add changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to GitHub
git push
```

---

## 🎯 Next Steps After Repository Created

1. ✅ Repository is private
2. Add collaborators (if team project)
3. Set up branch protection rules
4. Enable GitHub Actions (CI/CD) - optional
5. Add project description and topics
6. Star your own repo for easy access

---

## 📞 Need Help?

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com
- **GitHub Desktop**: https://docs.github.com/en/desktop

---

**Your HRMS project is ready to be uploaded to a private GitHub repository!** 🚀
