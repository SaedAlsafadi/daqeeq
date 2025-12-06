@echo off
cd /d "c:\Users\saeda\OneDrive\Desktop\GP"

echo Initializing Git repository...
git init

echo Configuring Git user...
git config user.name "Saed Alsafadi"
git config user.email "saed@example.com"

echo Adding remote repository...
git remote add origin https://github.com/SaedAlsafadi/GP_M7.git

echo Adding all files...
git add .

echo Creating initial commit...
git commit -m "Initial project commit - Cleanity Platform (ML forecasting + B2B service delivery)"

echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo Done!
pause
