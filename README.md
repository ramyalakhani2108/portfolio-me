# Portfolio Website - React + TypeScript + Vite + PostgreSQL

A modern, full-stack portfolio website with dual user experiences (employer view and general portfolio), built with React, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- **PostgreSQL** (installed via pgAdmin or Homebrew)
- **Node.js** v16+
- **npm** or **yarn**

### Setup

1. **Clone and Install**
   ```bash
   npm install
   ```

2. **Configure Database**
   - Update `.env` with your PostgreSQL credentials:
     ```env
     VITE_DB_HOST=localhost
     VITE_DB_PORT=5432
     VITE_DB_NAME=portfolio_db
     VITE_DB_USER=postgres
     VITE_DB_PASSWORD=your_password
     VITE_JWT_SECRET=your_secure_secret
     ```

3. **Create Database**
   ```bash
   psql -U postgres
   CREATE DATABASE portfolio_db;
   \q
   ```

4. **Run Migrations**
   ```bash
   npm run migrate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

📚 **New to this setup?** Check out [QUICKSTART.md](QUICKSTART.md) for detailed instructions!

## 📖 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Fast setup guide
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Comprehensive setup and troubleshooting
- **[MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)** - Complete list of changes from Supabase
- **[CHECKLIST.md](CHECKLIST.md)** - Setup checklist and action items

## 🎯 Features

- **Dual User Experience**: Separate views for employers and general visitors
- **Admin Dashboard**: Full CMS for managing portfolio content
- **Authentication**: Custom auth system with bcrypt password hashing
- **Dynamic Hire View**: Customizable sections for employer-focused content
- **Contact Forms**: Built-in contact management system
- **Analytics**: Visitor tracking and insights
- **Resume Generator**: Dynamic resume creation
- **Responsive Design**: Works on all devices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, Framer Motion
- **Database**: PostgreSQL with pg library
- **Authentication**: bcryptjs, JWT sessions
- **State Management**: React Context API

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
