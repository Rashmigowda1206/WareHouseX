#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "[*] Step 1: Installing Node & Building Frontend..."
cd frontend
npm install
npm run build
cd ..

echo "[*] Step 2: Installing Python Dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "[*] Step 3: Initializing Database & Seed Data..."
python backend/database/seed_data.py

echo "[*] Build completed successfully!"
