# Frontend Customization Guide

This guide shows you how to customize the CraftYourStartup boilerplate frontend to match your brand and requirements.

## 🎨 **Branding & Visual Identity**

### **1. Logo and Branding**

#### **Replace Logo Files**
```bash
# Replace these files in frontend/public/assets/
favicon-16x16.png    # Browser tab icon (16x16)
favicon-32x32.png    # Browser tab icon (32x32)
favicon.ico          # Browser favicon
logo.svg             # Main application logo

# Optional branded assets
hammer-logo.png      # Replace with your logo
social-cube-*.jpg    # Social media preview images
```

#### **Update Logo in Components**
```typescript
// frontend/src/components/ui/Header.tsx
// Replace the logo import and usage
import YourLogo from '/assets/your-logo.svg';

const Header = () => (
  <img src={YourLogo} alt="Your Company" height="40" />
);
```

### **2. Color Scheme and Theme**

#### **Primary Theme Colors**
```typescript
// frontend/src/theme/themePrimitives.ts
export const brand = {
  50: '#f0f9ff',   // Lightest brand color
  100: '#e0f2fe',  // Very light brand
  200: '#bae6fd',  // Light brand
  300: '#7dd3fc',  // Medium light brand
  400: '#38bdf8',  // Medium brand
  500: '#0ea5e9',  // Primary brand color (main)
  600: '#0284c7',  // Medium dark brand
  700: '#0369a1',  // Dark brand
  800: '#075985',  // Very dark brand
  900: '#0c4a6e',  // Darkest brand
};

// Update with your brand colors
export const brand = {
  50: '#your-lightest-color',
  // ... your color palette
  500: '#your-primary-color',  // This is your main brand color
  // ... rest of your colors
};
```

#### **Secondary Colors**
```typescript
// In the same file, update secondary colors
export const gray = {
  // Neutral colors for text, backgrounds, etc.
  // Customize these to match your brand's neutral palette
};
```

### **3. Typography**

#### **Font Configuration**
```typescript
// frontend/src/theme/themePrimitives.ts
export const typography = {
  fontFamily: [
    '"Inter"',           // Primary font
    '"Roboto"',          // Fallback
    '"Helvetica Neue"',  // System fallback
    'Arial',
    'sans-serif',
  ].join(','),
  
  // Font weights
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
};

// To use custom fonts:
// 1. Add font files to frontend/public/fonts/
// 2. Import in frontend/src/index.css
// 3. Update fontFamily array above
```

#### **Custom Font Integration**
```css
/* frontend/src/index.css */
@import url('https://fonts.googleapis.com/css2?family=YourFont:wght@300;400;500;700&display=swap');

/* Or for local fonts: */
@font-face {
  font-family: 'YourCustomFont';
  src: url('/fonts/your-font.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

## 🏠 **Landing Page Customization**

### **1. Hero Section**
```typescript
// frontend/src/components/Home/HeroSection.tsx
const HeroSection = () => (
  <Box>
    <Typography variant="h1">
      Your Compelling Headline
    </Typography>
    <Typography variant="h5" color="text.secondary">
      Your value proposition and key benefits
    </Typography>
    <Button variant="contained" size="large">
      Your Call-to-Action
    </Button>
  </Box>
);
```

### **2. Features Section**
```typescript
// frontend/src/components/Home/FeaturesSection.tsx
const features = [
  {
    icon: <YourIcon />,
    title: "Your Feature 1",
    description: "Benefit-focused description of your feature"
  },
  {
    icon: <YourIcon2 />,
    title: "Your Feature 2", 
    description: "How this feature helps your customers"
  },
  // Add more features
];
```

### **3. Background Images**
```bash
# Replace background images in frontend/src/assets/
bg-scene-1.jpg    # Hero background
bg-scene-2.jpg    # Section backgrounds
# ... add your own branded backgrounds
```

## 💳 **Pricing Page Customization**

### **1. Pricing Tiers**
```typescript
// frontend/src/config/landingPage.ts
export const pricingPlans = [
  {
    title: "Starter",
    price: "$9",
    period: "month",
    features: [
      "Feature 1 for starter plan",
      "Feature 2 for starter plan",
      "Up to X users/items/etc"
    ],
    buttonText: "Start Free Trial",
    highlighted: false,
  },
  {
    title: "Pro", 
    price: "$29",
    period: "month",
    features: [
      "Everything in Starter",
      "Advanced feature 1",
      "Advanced feature 2",
      "Priority support"
    ],
    buttonText: "Start Free Trial",
    highlighted: true, // Makes this plan stand out
  },
  // Add more plans
];
```

### **2. Feature Comparison**
```typescript
// Add detailed feature comparison
export const featureComparison = [
  {
    feature: "Your Core Feature",
    starter: "Basic version",
    pro: "Advanced version", 
    enterprise: "Full version"
  },
  // Add more feature comparisons
];
```

## 🎛️ **Dashboard Customization**

### **1. Dashboard Layout**
```typescript
// frontend/src/components/ui/DashboardLayout.tsx
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Your Feature 1', icon: <YourIcon />, path: '/feature1' },
  { text: 'Your Feature 2', icon: <YourIcon2 />, path: '/feature2' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  // Customize navigation based on your features
];
```

### **2. Dashboard Cards**
```typescript
// frontend/src/components/ui/DashboardCard.tsx
// Create custom dashboard widgets
const CustomMetricCard = ({ title, value, icon, trend }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center">
        {icon}
        <Box ml={2}>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="h4">{value}</Typography>
          {trend && <Typography color="success.main">↗ {trend}</Typography>}
        </Box>
      </Box>
    </CardContent>
  </Card>
);
```

## 📱 **Responsive Design**

### **1. Breakpoint Customization**
```typescript
// frontend/src/theme/themePrimitives.ts
export const customBreakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
  // Add custom breakpoints if needed
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};
```

### **2. Mobile-First Components**
```typescript
// Example responsive component
const ResponsiveHero = () => (
  <Box
    sx={{
      padding: { xs: 2, sm: 4, md: 6 },
      textAlign: { xs: 'center', md: 'left' },
      flexDirection: { xs: 'column', md: 'row' }
    }}
  >
    <Typography 
      variant="h1"
      sx={{
        fontSize: { xs: '2rem', sm: '3rem', md: '4rem' }
      }}
    >
      Your Headline
    </Typography>
  </Box>
);
```

## 🌙 **Dark Mode Support**

### **1. Theme Toggle**
The boilerplate includes built-in dark mode support:

```typescript
// frontend/src/theme/ColorModeSelect.tsx
// Already implemented - customize the toggle UI if needed

// To access theme mode in components:
import { useColorScheme } from '@mui/material/styles';

const YourComponent = () => {
  const { mode, setMode } = useColorScheme();
  
  return (
    <Button onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
      Toggle Theme
    </Button>
  );
};
```

### **2. Dark Mode Colors**
```typescript
// frontend/src/theme/themePrimitives.ts
// Customize dark mode palette
export const colorSchemes = {
  light: {
    palette: {
      primary: { main: '#your-light-primary' },
      background: { default: '#ffffff' },
    }
  },
  dark: {
    palette: {
      primary: { main: '#your-dark-primary' },
      background: { default: '#121212' },
    }
  }
};
```

## 🔧 **Component Library**

### **1. Custom Components**
Create reusable components for your brand:

```typescript
// frontend/src/components/ui/YourBrandButton.tsx
export const YourBrandButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2, // More rounded
  textTransform: 'none', // No uppercase
  fontWeight: 600,
  padding: '12px 24px',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  }
}));
```

### **2. Custom Icons**
```typescript
// frontend/src/components/icons/YourIcons.tsx
export const YourCustomIcon = (props: SvgIconProps) => (
  <SvgIcon {...props}>
    <path d="your-svg-path-data" />
  </SvgIcon>
);
```

## 📄 **Content Management**

### **1. Static Content**
```typescript
// frontend/src/config/landingPage.ts
export const content = {
  company: {
    name: "Your Company Name",
    tagline: "Your compelling tagline",
    description: "What your company does and why it matters"
  },
  
  hero: {
    headline: "Your Main Value Proposition",
    subheadline: "Supporting text that explains the benefit",
    ctaText: "Get Started Free"
  },
  
  features: [
    {
      title: "Feature 1",
      description: "How this feature helps your customers",
      icon: "feature1-icon"
    }
    // Add more features
  ],
  
  testimonials: [
    {
      name: "Customer Name",
      company: "Customer Company", 
      quote: "How your product helped them",
      avatar: "/assets/customer1.jpg"
    }
    // Add more testimonials
  ]
};
```

### **2. SEO Optimization**
```typescript
// frontend/src/components/SEO.tsx
export const SEO = ({ title, description, image }) => (
  <Helmet>
    <title>{title} | Your Company</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image} />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
  </Helmet>
);
```

## 🚀 **Build and Deployment**

### **1. Environment Variables**
```bash
# frontend/.env.production
VITE_APP_NAME="Your App Name"
VITE_API_URL="https://your-api-domain.com"
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_key"
```

### **2. Build Optimization**
```typescript
// frontend/vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Optimize bundle splitting for your app
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          // Add your custom chunks
        }
      }
    }
  }
});
```

## ✅ **Customization Checklist**

### **Visual Branding**
- [ ] Logo and favicon updated
- [ ] Brand colors configured
- [ ] Typography customized
- [ ] Background images replaced

### **Content**
- [ ] Company name and tagline updated
- [ ] Hero section customized
- [ ] Features section updated
- [ ] Pricing plans configured
- [ ] About/contact information updated

### **Functionality**
- [ ] Navigation menu customized
- [ ] Dashboard layout adapted
- [ ] Custom components created
- [ ] Forms customized for your data

### **Technical**
- [ ] SEO metadata updated
- [ ] Environment variables configured
- [ ] Build optimization completed
- [ ] Responsive design tested

Your customized frontend is now ready to represent your brand! 🎨

## 🔄 **Maintaining Customizations**

When updating the boilerplate:
1. Keep your customizations in separate files when possible
2. Document your changes
3. Test thoroughly after updates
4. Use version control to track customizations

Need help with specific customizations? Check the component source code or create custom components following the established patterns.
