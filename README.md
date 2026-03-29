# Smart Expense Reimbursement Management System (SERMS)

AI-powered reimbursement management system with OCR and fraud detection.

## Problem Statement
Manual expense reimbursements are prone to fraud, manual entry errors, and slow approval cycles. Companies lose millions due to duplicate claims or exaggerated amounts.

## Solution
SERMS uses AI-based OCR (Tesseract) to extract data from receipts, automatically validates it against company rules, and provides real-time tracking via Socket.IO for both employees and managers.

## Features
- **Upload Receipt**: Drag and drop receipt images.
- **AI-OCR Extraction**: Automatically extract amount, date, and category.
- **Fraud Prevention**: Rules-based validation to detect anomalies.
- **Manager Dashboard**: One-click approval/rejection workflows.
- **Admin Control**: Define custom organizational reimbursement rules.
- **Real-time Notifications**: Status updates via WebSockets.

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS, ShadCN UI
- **Backend**: Node.js, Express.js
- **ORM**: Prisma (SQLite/PostgreSQL)
- **Real-time**: Socket.IO
- **OCR**: Tesseract.js

## Project Structure
- /frontend: Next.js Client App
- /backend: Express Server & API
- /docs: Documentation & Assets

## Installation
1. Clone the repository:
   \\\ash
   git clone https://github.com/shivammane2007/Reimbursement_Management.git
   \\\`n2. Install root dependencies:
   \\\ash
   npm install
   \\\`n3. Setup Environment:
   Copy \.env.example\ to \.env\ in both folders and configure.
4. Run Development Server:
   \\\ash
   npm run dev
   \\\`n
## License
MIT