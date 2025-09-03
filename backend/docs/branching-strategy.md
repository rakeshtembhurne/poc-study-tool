# Branching Strategy

This document defines the Git branching strategy for our project.  
It is based on the **GitFlow Workflow** recommended by Atlassian.  

---

## 1. Branch Types

We will use the following types of branches:

### **`main`**
- Always contains production-ready code.  
- Only stable, tested, and reviewed code should be merged here.  
- Protected branch (no direct commits, only PRs allowed).  

### **`develop`**
- Integration branch where all new features are merged.  
- Represents the latest delivered development changes for the next release.  
- Protected branch.  

### **`feature/*`**
- Used for developing new features or tasks.  
- Always branch off from `develop`.  
- Naming convention: `feature/<short-description>`  
  - Example: `feature/login-authentication`  
- Merged back into `develop` after review.  

### **`release/*`** (optional, used for preparing a new version)
- Branch created from `develop` when preparing a release.  
- Used for final bug fixes, versioning, and documentation updates.  
- Merged into both `main` and `develop` once released.  

### **`hotfix/*`** (optional, used for urgent fixes in production)
- Branch created from `main` to fix production issues.  
- Naming convention: `hotfix/<short-description>`  
- Merged into both `main` and `develop`.  

---

## 2. Workflow

1. **Start a new feature**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature
   ```

2. **Work on the feature**
   - Commit changes regularly.  
   - Push to remote to share with the team:
     ```bash
     git push origin feature/your-feature
     ```

3. **Open a Pull Request (PR)**
   - From `feature/your-feature` → `develop`.  
   - At least one reviewer must approve.  

4. **Merge into `develop`**
   - Only after review and CI checks.  

5. **Release Preparation**
   - Create `release/*` branch from `develop` when ready.  
   - Merge into `main` after final testing.  

6. **Hotfix**
   - Create `hotfix/*` branch from `main` for urgent fixes.  
   - Merge into both `main` and `develop`.  

---

## 3. Branch Protection Rules

### **`main` branch**
- Require pull request before merging.  
- Require at least 1 code review approval.  
- Require CI (linting/tests) to pass.  
- No force pushes.  
- No direct commits.  

### **`develop` branch**
- Require pull request before merging.  
- Require at least 1 code review approval.  
- No force pushes.  
- No direct commits.  

---

## 4. Naming Conventions

- **Feature branches**: `feature/<short-description>`  
  - Example: `feature/user-profile-page`  
- **Release branches**: `release/<version>`  
  - Example: `release/1.0.0`  
- **Hotfix branches**: `hotfix/<short-description>`  
  - Example: `hotfix/fix-login-bug`  

---

## 5. Team Workflow Summary

- Always branch off from `develop`.  
- Never commit directly to `main` or `develop`.  
- Use Pull Requests for merging.  
- Ensure code review and tests are passed before merging.  
- Keep branch names meaningful.  

---

## 6. Diagram

```
main ───────●───────────●───────────●────────
             ↑
       develop ──●───────●───────●─────●─────
                  ↑       ↑
            feature/A   feature/B
```
---