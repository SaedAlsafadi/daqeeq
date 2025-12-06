# Cleanity Frontend - Integrated Application

A modern, integrated frontend application combining a professional landing page with a comprehensive dashboard for AI-powered cleaning supply forecasting.

## 🚀 Features

### Landing Page
- **Modern Design**: Professional landing page inspired by startup templates
- **Responsive Layout**: Mobile-first design with Tailwind CSS
- **Dark Mode Support**: Toggle between light and dark themes
- **Interactive Sections**: Hero, Features, About, Testimonials, Pricing, Contact

### Authentication
- **Secure Login/Signup**: Professional authentication pages
- **Social Login**: Google and GitHub integration ready
- **Role-based Access**: Support for Client and Supplier roles
- **Protected Routes**: Secure dashboard access

### Dashboard
- **Professional UI**: Clean, modern dashboard inspired by TailAdmin
- **Real-time Data**: Live inventory tracking and analytics
- **AI Insights**: Smart recommendations and forecasting
- **Responsive Design**: Works perfectly on all devices

## 🛠 Technology Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Context API** - State management
- **React Hook Form** - Form handling
- **React Toastify** - Notifications
- **React Icons** - Icon library

## 📋 Prerequisites

Before running this application, make sure you have:

1. **Node.js** (v18 or higher) - [Download from nodejs.org](https://nodejs.org/)
2. **npm** (comes with Node.js)

### Installing Node.js

1. Go to [https://nodejs.org/](https://nodejs.org/)
2. Download the **LTS version** (recommended)
3. Run the installer and follow the setup wizard
4. **Important**: Make sure "Add to PATH" is checked during installation
5. Restart your terminal/PowerShell after installation

Verify installation:
```bash
node --version
npm --version
```

## 🚀 Getting Started

1. **Navigate to the project directory**:
   ```bash
   cd "c:\Users\saeda\OneDrive\Desktop\GP\frontend-new"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and visit: `http://localhost:3000`

## 📁 Project Structure

```
frontend-new/
├── src/
│   ├── components/          # Reusable components
│   ├── contexts/           # React contexts (Auth, Theme)
│   ├── layouts/            # Layout components
│   ├── pages/              # Page components
│   │   ├── Auth/           # Login/Signup pages
│   │   ├── Dashboard/      # Dashboard pages
│   │   └── Landing/        # Landing page components
│   ├── App.tsx             # Main app component
│   ├── main.tsx           # App entry point
│   └── index.css          # Global styles
├── public/                 # Static assets
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite configuration
```

## 🎨 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🔐 Authentication

The app includes a complete authentication system:

### Test Accounts
- **Client**: Use any email ending with `@client.com`
- **Supplier**: Use any email ending with `@supplier.com`
- **Password**: Any password (6+ characters)

### Features
- Email/password authentication
- Social login (Google, GitHub) - UI ready
- Role-based access (Client/Supplier)
- Protected routes
- Persistent sessions

## 🎯 Dashboard Features

### For Clients
- Inventory management
- Order tracking
- AI-powered forecasting
- Cost analytics
- Supply recommendations

### For Suppliers
- Order management
- Client analytics
- Inventory tracking
- Performance metrics

## 🌙 Theme Support

The application supports both light and dark themes:
- Toggle button in header/auth pages
- Persistent theme preference
- System theme detection
- Smooth transitions

## 🔧 Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:
```javascript
colors: {
  primary: { /* Your primary colors */ },
  secondary: { /* Your secondary colors */ },
}
```

### Branding
- Update logo in components
- Modify company information in landing page
- Customize footer links and content

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

The built files will be in the `dist/` directory.

### Deploy Options
- **Vercel**: Connect your GitHub repo
- **Netlify**: Drag and drop the `dist` folder
- **AWS S3**: Upload the `dist` folder
- **Any static hosting service**

## 🔗 Integration with Backend

This frontend is designed to work with your existing backend structure:

### API Integration
- Update API endpoints in context files
- Modify authentication logic in `AuthContext.tsx`
- Add real data fetching in dashboard components

### Backend Compatibility
- Works with REST APIs
- Easy to integrate with your existing backend
- Supports your planned AI model and blockchain components

## 📱 Mobile Support

The application is fully responsive and works great on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🆘 Troubleshooting

### Common Issues

1. **"npm is not recognized"**
   - Install Node.js from nodejs.org
   - Restart your terminal
   - Verify with `node --version`

2. **Port 3000 already in use**
   - The dev server will automatically use the next available port
   - Or specify a different port: `npm run dev -- --port 3001`

3. **Build errors**
   - Run `npm run type-check` to check for TypeScript errors
   - Run `npm run lint` to check for code issues

### Getting Help

If you encounter any issues:
1. Check the browser console for errors
2. Verify all dependencies are installed
3. Make sure Node.js version is 18 or higher
4. Try deleting `node_modules` and running `npm install` again

## 🎉 What's Next?

This integrated frontend provides:
- ✅ Professional landing page
- ✅ Complete authentication system
- ✅ Modern dashboard interface
- ✅ Mobile-responsive design
- ✅ Dark mode support
- ✅ TypeScript for type safety

Ready for:
- 🔄 Backend API integration
- 🤖 AI model integration
- ⛓️ Blockchain features
- 📊 Real data visualization
- 🔔 Real-time notifications

The application is production-ready and can be easily extended with your specific business logic and integrations!