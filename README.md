# 💰 MiniLedger - Track Money Lent to Friends

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![React Native](https://img.shields.io/badge/React_Native-Expo_58-61DAFB?style=flat&logo=react)](https://reactnative.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2F18-4169E1?style=flat&logo=postgresql)](https://www.postgresql.org)
[![Tests](https://img.shields.io/badge/Tests-14%20Passing-brightgreen?style=flat&logo=jest)](https://jestjs.io)

**MiniLedger** is a full-stack personal debt tracking application designed to help individuals record, manage, and monitor money lent to friends and family. It features a fast **Node.js + TypeScript + PostgreSQL** backend API and a modern, high-polish **React Native (Expo)** cross-platform application that runs on Web, Android, and iOS.

---

## 🌟 Key Features

### Backend (Node.js + TypeScript + PostgreSQL)
- 🔑 **Phone Number Login with Mock OTP**: One-time passcodes generated and printed prominently to server logs with 5-minute expiry.
- 💳 **Loan Entry Management**: Create loans with friend name, amount, due date, notes, and optional receipt image attachments.
- ⚡ **One-Tap Repayment**: Mark active loans as settled with automatic timestamp tracking.
- 📊 **Financial Summary Endpoint**: Real-time aggregated statistics:
  - `totalLent`: Total principal lent across all loans
  - `totalRepaid`: Total amount repaid and settled
  - `totalPending`: Outstanding balance to be collected
  - `overdueAmount`: Sum of all unpaid loans whose due date is past
  - Counts for total, active, overdue, and repaid loans
- 🛡️ **Bonus: Strict Input Validation**: Powered by `zod` schema validation for clean request enforcement.
- 📷 **Bonus: Receipt Photo Upload**: Multipart image upload via `multer` served over static endpoints.
- 🧪 **Bonus: Comprehensive Automated Tests**: 14 integration test suites with Jest & Supertest.

### Mobile App (React Native + Expo)
- 📱 **Cross-Platform**: Runs on Web (`localhost`), Android, and iOS via Expo.
- 🔐 **Authentication Flow**: Clean phone number input and 6-digit OTP verification with countdown timer and dev auto-fill shortcut.
- 📈 **Top Summary Card**: High-contrast fintech card highlighting Total Lent, Pending Balance, Total Repaid, and an **Alert Banner for Overdue Amounts**.
- 🚨 **Prominent Overdue Highlighting**: Overdue loans stand out with crimson alert badges, warning icons, and days-elapsed calculation (e.g., *"Overdue by 5 days"*).
- 🏷️ **Status Filter Tabs & Search**: Filter instantly by `All`, `Active`, `Overdue`, and `Repaid` with badge counts, plus name search.
- ➕ **Add Loan Modal**: Quick presets (*Today*, *Tomorrow*, *+1 Week*, *+1 Month*, *Past Date for testing*), currency formatter, and receipt image picker (camera or gallery).
- 🖼️ **Receipt Preview Modal**: Tap any receipt thumbnail on a loan card to view the full image.

---

## 🏗️ Architecture & Project Structure

```
Credsetu/
├── backend/                  # Node.js + TypeScript API
│   ├── src/
│   │   ├── config/env.ts     # Environment configuration
│   │   ├── db/index.ts       # PostgreSQL connection & dual-mode fallback
│   │   ├── middleware/       # Auth (JWT), Multer (Uploads), Zod Validation
│   │   ├── routes/           # Auth, Loan, and Summary routes
│   │   ├── app.ts            # Express application setup
│   │   └── server.ts         # Server bootstrap
│   ├── tests/                # Jest + Supertest integration tests
│   ├── uploads/              # Stored receipt photos
│   └── package.json
│
├── mobile/                   # React Native (Expo) app
│   ├── src/
│   │   ├── components/       # SummaryCard, LoanCard, AddLoanModal, etc.
│   │   ├── context/          # AuthContext with AsyncStorage token persistence
│   │   ├── screens/          # LoginScreen, DashboardScreen
│   │   ├── services/api.ts   # Unified API client & endpoint definitions
│   │   └── types/            # TypeScript interfaces
│   ├── App.tsx               # Root app navigator
│   └── package.json
│
├── docker-compose.yml        # Optional Docker PostgreSQL service
└── README.md
```

### Dual-Mode Database Resilience
The backend supports zero-setup evaluation:
1. **External PostgreSQL**: If `DATABASE_URL` is configured in `.env`, it connects using standard `pg.Pool`.
2. **Embedded PostgreSQL (PGlite)**: If no external database is configured, it automatically boots embedded native PostgreSQL (PGlite compiled from Postgres C to WebAssembly) with disk persistence at `backend/data/pgdata`. This allows anyone cloning the repository to run `npm run dev` immediately without needing to install or start Docker!

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher; v22 recommended)
- `npm` or `yarn`

---

### Step 1: Start the Backend

1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. (Optional) Configure `.env`:
   ```bash
   cp .env.example .env
   ```
   *Note: If `DATABASE_URL` is omitted, the backend runs the persistent embedded PostgreSQL engine out of the box.*

3. (Optional) Run with Docker PostgreSQL:
   If you prefer running a local PostgreSQL Docker container:
   ```bash
   docker compose up -d
   ```

4. Run database tests:
   ```bash
   npm test
   ```
   *Runs all 14 integration tests verifying mock OTP, validation, loan lifecycle, overdue calculation, and summary calculations.*

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   The server will start at **`http://localhost:5000`**.

---

### Step 2: Start the Mobile App

1. In a new terminal, navigate to `mobile` and install dependencies:
   ```bash
   cd mobile
   npm install
   ```

2. Start the app:
   - **For Web Browser (fastest & easiest for screen recording):**
     ```bash
     npm run web
     ```
     Press `w` in terminal or open **`http://localhost:8081`** in your browser.

   - **For Android Simulator / iOS Simulator:**
     ```bash
     npm run android
     # or
     npm run ios
     ```

   - **For Physical Device (Expo Go):**
     ```bash
     npx expo start
     ```
     Scan the QR code with the Expo Go app on your phone.
     *(Note: If using a physical phone on Wi-Fi, tap the server badge on the login screen to enter your computer's local IP address, e.g., `http://192.168.1.5:5000`)*.

---

## 🔑 Authentication (Mock OTP Flow)

1. On the Login screen, enter any phone number (e.g., `+91 9876543210` or `9876543210`).
2. Tap **"Send Mock OTP"**.
3. Look at your **backend terminal log**. You will see:
   ```
   ======================================================
   🔑 [MOCK OTP SERVICE]
   📱 Phone Number : +919876543210
   💬 One-Time Pass: 728680
   ⏰ Valid For    : 5 Minutes
   ======================================================
   ```
4. Enter the 6-digit code in the app (or click the dev shortcut **"Auto-fill OTP"**).
5. Tap **"Verify & Continue"** to enter the dashboard.

---

## 📡 API Reference Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `POST` | `/api/auth/send-otp` | Generates & logs mock OTP to terminal | `{ "phone": "+919876543210" }` |
| `POST` | `/api/auth/verify-otp` | Verifies OTP and returns JWT token | `{ "phone": "+919876543210", "otp": "123456" }` |
| `GET` | `/api/auth/me` | Returns current user profile | Header: `Authorization: Bearer <token>` |

### Loan Management Endpoints

| Method | Endpoint | Description | Payload / Query |
|---|---|---|---|
| `POST` | `/api/loans` | Creates a new loan entry (supports multipart receipt) | `{ "friendName": "Rahul", "amount": 2500, "dueDate": "2026-11-01", "notes": "Dinner" }` |
| `GET` | `/api/loans` | Retrieves loans for user | Query params: `status=all|active|overdue|repaid`, `search`, `sort` |
| `GET` | `/api/loans/:id` | Retrieves detail of specific loan | Path param: `id` |
| `PATCH` | `/api/loans/:id/repay` | Marks a loan as settled & repaid | Path param: `id` |
| `DELETE` | `/api/loans/:id` | Deletes a loan entry | Path param: `id` |

### Summary Endpoint

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/summary` | Returns financial totals (`totalLent`, `totalRepaid`, `totalPending`, `overdueAmount`) and breakdown counts. |

#### Example Summary Response:
```json
{
  "success": true,
  "summary": {
    "totalLent": 6700,
    "totalRepaid": 2000,
    "totalPending": 4700,
    "overdueAmount": 1200,
    "counts": {
      "total": 3,
      "active": 2,
      "overdue": 1,
      "repaid": 1
    }
  }
}
```

---

## 🧪 Automated Testing

Run the test suite in the backend directory:
```bash
cd backend
npm test
```

### Test Coverage Highlights:
- ✅ Health check verification
- ✅ Phone number formatting & validation
- ✅ Mock OTP issuance and terminal logging
- ✅ OTP verification & JWT security
- ✅ Protection on private endpoints (401 on missing token)
- ✅ Zod input validation (negative numbers, empty names, malformed dates)
- ✅ Loan creation with future and past due dates
- ✅ Dynamic computation of `isOverdue` flag
- ✅ Status filtering (`status=overdue`, `status=active`, etc.)
- ✅ One-tap loan repayment toggle
- ✅ Mathematical precision of `totalLent`, `totalRepaid`, and `overdueAmount`

---

## 🎥 Screen Recording Walkthrough Guide (2–3 Minutes)

When recording your Loom or Google Drive video, follow this quick sequence:
1. **Terminal View (30 sec)**:
   - Show `npm run dev` running in the backend terminal.
   - Trigger the login flow: show the mock OTP logged in server logs with the banner.
2. **Login Screen (30 sec)**:
   - Enter phone number, show the verification screen, enter OTP, and log in.
3. **Dashboard & Summary Card (45 sec)**:
   - Point out the top summary card (`Total Lent`, `Pending Balance`, `Total Repaid`, and highlighted `Overdue Amount`).
   - Add a new active loan entry (Friend: "Rahul", Amount: 2000, Due date in the future).
   - Add an overdue loan entry (use the "Past (Overdue Test)" preset or a date before today).
   - Show how the overdue card automatically highlights with an alert badge and red banner.
   - (Bonus) Attach a receipt image to show the receipt thumbnail and expand the preview modal.
4. **Repayment & Filter (30 sec)**:
   - Tap **"Mark Repaid"** on one loan.
   - Show the summary card instantly update (`Total Repaid` increases, `Pending` decreases).
   - Switch between filter tabs: **All**, **Active**, **Overdue**, **Repaid**.
5. **Wrap Up (15 sec)**:
   - Mention the automated tests (`npm test` passing) and clean TypeScript + PostgreSQL architecture.

---

## 📜 License
MIT License. Created for the Full Stack Development Assessment.
