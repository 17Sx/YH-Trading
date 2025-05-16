# 📈 YH Trading Journal

![Next.js](https://img.shields.io/badge/Next.js-14.2.3-blue?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38BDF8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-2.x-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/license-MIT-green)

> **YH Trading Journal** is a modern, full-featured web application to track, analyze, and improve your trading performance.  
> Designed for traders who want beautiful analytics, seamless journaling, and actionable insights.

---

## ✨ Features

- **Authentication**: Secure sign up & sign in (Supabase Auth)
- **Dashboard**: Global stats, winrate, PnL, profit factor, and more
- **Trading Journal**: Add, edit, delete, and review trades with rich details
- **Charts & Analytics**: Cumulative PnL, monthly PnL, winrate distribution, session performance
- **Calendar View**: Visualize your trades and performance over time
- **Responsive UI**: Beautiful, dark-themed, mobile-friendly interface
- **Customizable**: Manage assets, sessions, setups, and notes
- **Export/Import**: (Planned) Export your data for further analysis

---

## 🚀 Demo

> https://yhtrading.vercel.app/
> You can run the project locally by following the instructions below.

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/YH-Trading.git
cd YH-Trading
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### 4. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

---

## 🗂️ Project Structure

```
.
├── app/                # Next.js app directory (routing, pages)
│   ├── dashboard/      # Dashboard overview
│   ├── journal/        # Trading journal (CRUD, analytics)
│   ├── calendar/       # Calendar view of trades
│   └── (auth)/auth/    # Authentication pages
├── components/         # Reusable UI and feature components
│   ├── journal/        # Journal-specific components (modals, tables, charts)
│   ├── auth/           # Auth forms
│   └── ui/             # UI primitives (buttons, dialogs, calendar, etc.)
├── lib/                # API, actions, and utility functions
├── public/             # Static assets
├── schemas/            # Zod validation schemas
├── tailwind.config.ts  # TailwindCSS configuration
└── ...
```

---

## 🧠 Core Concepts

### Authentication

- Secure sign up and sign in using Supabase Auth.
- Only authenticated users can access the dashboard, journal, and calendar.

### Dashboard

- **Global statistics**: Total trades, winrate, total/average PnL, profit factor, and more.
- **Charts**: Cumulative PnL and monthly PnL bar charts for quick performance overview.

### Trading Journal

- **CRUD**: Add, edit, delete, and view trades.
- **Details**: Track asset, session, setup, risk, PnL, notes, and TradingView links.
- **Analytics**: Winrate distribution, session performance, and more.
- **Modals**: Intuitive modals for trade management.

### Calendar

- Visualize trades over 1, 3, 6, or 12 months.
- Quickly spot trading patterns and performance streaks.

### UI/UX

- Modern, dark-themed, responsive design.
- Smooth transitions and interactive charts.
- Built with accessibility and user experience in mind.

---

## 🏗️ Tech Stack

- **Next.js 14** (App Router, SSR)
- **TypeScript**
- **TailwindCSS** (with custom themes and animations)
- **Supabase** (Auth & Database)
- **React Hook Form** & **Zod** (forms & validation)
- **Recharts** (data visualization)
- **Framer Motion** (animations)
- **Radix UI** (accessible dialogs)
- **Three.js** (background effects)
- **Sonner** (toasts/notifications)

---

> _Made with ❤️ by 17Sx!_
