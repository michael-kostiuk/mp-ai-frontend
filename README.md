# Meal Planning Frontend

A responsive and visually appealing frontend interface for a meal planning backend application.

## Features

- Recipe browsing, filtering, and search
- Meal plan creation and management
- Shopping list generation and export
- Ingredient management
- Responsive design for all devices
- Configurable backend API connection

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure the backend API URL:

Edit the `.env` file to set your backend API URL:

```
VITE_API_URL=http://localhost:8000
```

4. Start the development server:

```bash
npm run dev
```

## API Integration

This frontend connects to a RESTful API for meal planning. The API endpoints include:

- `/recipes` - Recipe management
- `/meal-plans` - Meal plan management
- `/shopping-lists` - Shopping list management
- `/ingredients` - Ingredient management

The API URL can be configured in the UI through the settings panel on the home page.

## Build for Production

To create a production build:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Technology Stack

- React 18
- TypeScript
- Tailwind CSS
- React Router
- Lucide React (for icons)

## Development

- `npm run dev` - Run the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint