# Lumina Frontend

A modern React application for the AI Application Screening Platform, built with Vite and TailwindCSS.

## 🚀 Features

- **Applicant Dashboard**: Track application status, submit grades, and upload documents.
- **Admin Dashboard**: Comprehensive overview of application statistics and screening results.
- **Application Workflow**: Step-by-step form for creating and submitting applications.
- **Responsive Design**: Built with TailwindCSS for a seamless experience across devices.
- **Real-time Notifications**: Integrated with `react-toastify` for user feedback.

## 🛠 Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 8
- **State Management**: Zustand
- **Form Handling**: React Hook Form & Zod
- **Styling**: TailwindCSS
- **Routing**: React Router 7
- **Icons**: Custom SVG icons
- **Testing**: Vitest & React Testing Library

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend/lumina
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env.local` and update the `VITE_API_URL` to point to your backend API.
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## 🏗 Project Structure

- `src/components/`: Reusable UI components (common, forms, layout, tables).
- `src/pages/`: Page-level components for different user roles (applicant, admin, auth).
- `src/hooks/`: Custom React hooks for authentication, data fetching, and more.
- `src/services/`: API client and service modules for interacting with the backend.
- `src/store/`: Zustand stores for global state management.
- `src/utils/`: Helper functions, constants, and validation schemas.
- `src/styles/`: Global CSS and Tailwind configurations.

## 🧪 Testing

Run the test suite using Vitest:

```bash
npm run test
```

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` directory, ready to be served by any static hosting provider.
