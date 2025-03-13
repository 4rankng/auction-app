# Auction App Frontend

A modern web application for managing auction events.

## Demo Mode

This application includes a demo mode that allows you to run the frontend without requiring a backend server. This is useful for demonstrations, testing, and development purposes.

### Enabling Demo Mode

The demo mode is **enabled by default**. You can control it in the `.env.js` file:

```javascript
const envConfig = {
    // ...other settings...

    // Demo mode - Set to false to use actual backend API
    demoMode: true
};
```

### Demo Features

When running in demo mode:

1. All pages will display a "Demo Mode" indicator
2. The application uses an in-memory database for all operations
3. No backend server is required
4. Sample bidders are pre-loaded for convenience
5. A "Reset" button allows you to revert to the initial state

### Deploying with Demo Mode

When deploying to Netlify or other hosting services, you can keep demo mode enabled to showcase the application without requiring a backend.

To switch to using a real backend:

1. Set up the backend API server
2. Update the `apiBaseUrl` in `.env.js` to point to your backend
3. Set `demoMode: false` in `.env.js`

## Running the Application

### Locally

1. Clone the repository
2. Open `index.html` in a browser (no web server required with demo mode)

### Netlify Deployment

The application includes a `netlify.toml` file for easy deployment to Netlify:

1. Push your code to a GitHub repository
2. Connect the repository to Netlify
3. Netlify will automatically build and deploy your site

## Application Workflow

1. **Setup Page**: Configure auction settings and add bidders
2. **Bid Page**: Conduct the auction with real-time bidding
3. **Result Page**: View and export the auction results

## Features

- Modern, responsive UI
- Excel import/export for bidder data
- Real-time bidding interface
- Comprehensive auction management
- Offline capabilities with demo mode
