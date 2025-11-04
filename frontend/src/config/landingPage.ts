/**
 * Landing Page Configuration
 * 
 * This file contains all the content and configuration for your landing page.
 * Simply modify the values below to customize your startup's presentation.
 * 
 * Pro Tip: Keep your value propositions clear and benefit-focused!
 */

export interface LandingPageConfig {
  hero: HeroConfig;
  features: FeaturesConfig;
  testimonials: TestimonialsConfig;
  pricing: PricingPreviewConfig;
  stats: StatsConfig;
  cta: CTAConfig;
  faq: FAQConfig;
}

interface HeroConfig {
  // Main headline - keep it under 60 characters for impact
  headline: string;
  // Supporting headline - explain the main benefit
  subheadline: string;
  // Detailed description - what problem do you solve?
  description: string;
  // Primary call-to-action button text
  primaryCTA: string;
  // Secondary call-to-action button text
  secondaryCTA?: string;
  // Video/demo URL (optional)
  demoVideoUrl?: string;
  // Trust indicators (customer logos, certifications, etc.)
  trustIndicators: string[];
}

interface FeaturesConfig {
  // Section heading
  title: string;
  // Section description
  description: string;
  // List of features - aim for 3-6 key features
  features: Feature[];
}

interface Feature {
  title: string;
  description: string;
  icon: string; // Material UI icon name or custom icon path
  benefits: string[]; // List of specific benefits
}

interface TestimonialsConfig {
  title: string;
  testimonials: Testimonial[];
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating?: number; // 1-5 stars
}

interface PricingPreviewConfig {
  title: string;
  description: string;
  plans: PricingPlan[];
  ctaText: string;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  ctaText: string;
}

interface StatsConfig {
  title: string;
  stats: Stat[];
}

interface Stat {
  number: string;
  label: string;
  description?: string;
}

interface CTAConfig {
  title: string;
  description: string;
  primaryCTA: string;
  secondaryCTA?: string;
}

interface FAQConfig {
  title: string;
  description: string;
  questions: FAQ[];
}

interface FAQ {
  question: string;
  answer: string;
}

// 🎯 CUSTOMIZE YOUR CONTENT BELOW
// Replace with your startup's actual content

export const landingPageConfig: LandingPageConfig = {
  hero: {
    headline: "Build Your SaaS in Days, Not Months",
    subheadline: "The Complete Production-Ready Boilerplate",
    description: "Skip the tedious setup and focus on what matters - your unique value proposition. Our comprehensive boilerplate includes authentication, payments, admin panel, and modern UI components, all ready to deploy.",
    primaryCTA: "Get Started Now",
    secondaryCTA: "View Live Demo",
    demoVideoUrl: "https://www.youtube.com/embed/YOUR_DEMO_VIDEO_ID", // Replace with your actual video ID
    trustIndicators: [
      "SOC 2 Compliant",
      "GDPR Ready",
      "99.9% Uptime",
      "Enterprise Security"
    ]
  },

  features: {
    title: "Everything You Need to Launch Fast",
    description: "Don't waste months building basic functionality. Focus on your core product while we handle the infrastructure.",
    features: [
      {
        title: "Complete Authentication System",
        description: "OAuth, email verification, password reset, and role-based access control out of the box.",
        icon: "Security",
        benefits: [
          "OAuth integration (Google, GitHub, etc.)",
          "Email verification system",
          "Password reset functionality",
          "Role-based permissions",
          "Session management"
        ]
      },
      {
        title: "Payment Processing Ready",
        description: "Stripe integration with subscription management, invoicing, and webhook handling.",
        icon: "Payment",
        benefits: [
          "Stripe subscription billing",
          "Multiple payment methods",
          "Invoice generation",
          "Webhook handling",
          "Dunning management"
        ]
      },
      {
        title: "Modern React Frontend",
        description: "Beautiful, responsive UI built with Material-UI and best practices for performance.",
        icon: "Dashboard",
        benefits: [
          "Mobile-first responsive design",
          "Dark/light mode support",
          "Component library included",
          "TypeScript throughout",
          "Performance optimized"
        ]
      },
      {
        title: "Production-Ready Backend",
        description: "FastAPI backend with PostgreSQL, Redis caching, and comprehensive API documentation.",
        icon: "Storage",
        benefits: [
          "RESTful API with docs",
          "Database migrations",
          "Redis caching layer",
          "Background job processing",
          "Monitoring & logging"
        ]
      },
      {
        title: "Deployment & DevOps",
        description: "Docker containerization with CI/CD pipelines and cloud deployment scripts.",
        icon: "CloudUpload",
        benefits: [
          "Docker containerization",
          "GitHub Actions CI/CD",
          "Environment management",
          "Health checks",
          "Auto-scaling ready"
        ]
      },
      {
        title: "Admin Dashboard",
        description: "Complete admin interface for user management, analytics, and system monitoring.",
        icon: "AdminPanel",
        benefits: [
          "User management interface",
          "System analytics",
          "Content management",
          "Settings configuration",
          "Activity monitoring"
        ]
      }
    ]
  },

  testimonials: {
    title: "Trusted by Growing Startups",
    testimonials: [
      {
        name: "Sarah Chen",
        role: "Founder & CEO",
        company: "DataFlow AI",
        content: "This boilerplate saved us 3 months of development time. We went from idea to MVP in just 2 weeks. The code quality is exceptional and the documentation is thorough.",
        rating: 5
      },
      {
        name: "Marcus Rodriguez",
        role: "CTO",
        company: "FinanceHub",
        content: "The payment integration alone was worth the investment. Everything just works out of the box, and the code is clean and well-documented. Highly recommended!",
        rating: 5
      },
      {
        name: "Emily Watson",
        role: "Lead Developer",
        company: "CloudSync Pro",
        content: "As a solo developer, this boilerplate was a game-changer. I could focus on my unique features instead of rebuilding the same authentication and payment systems.",
        rating: 5
      }
    ]
  },

  pricing: {
    title: "Simple, Transparent Pricing",
    description: "Choose the plan that fits your needs. All plans include lifetime updates and support.",
    ctaText: "View All Plans",
    plans: [
      {
        name: "Starter",
        price: "$97",
        period: "one-time",
        description: "Perfect for side projects and MVPs",
        features: [
          "Complete source code",
          "Authentication system",
          "Basic payment integration",
          "Responsive UI components",
          "Documentation & setup guide"
        ],
        ctaText: "Get Starter"
      },
      {
        name: "Pro",
        price: "$197",
        period: "one-time",
        description: "Everything you need for production",
        features: [
          "Everything in Starter",
          "Advanced payment features",
          "Admin dashboard",
          "Email templates",
          "Priority support",
          "Deployment scripts"
        ],
        popular: true,
        ctaText: "Get Pro"
      },
      {
        name: "Enterprise",
        price: "$497",
        period: "one-time",
        description: "For teams and larger projects",
        features: [
          "Everything in Pro",
          "Multi-tenant architecture",
          "Advanced analytics",
          "White-label ready",
          "Custom integrations",
          "1-on-1 setup call"
        ],
        ctaText: "Get Enterprise"
      }
    ]
  },

  stats: {
    title: "Proven Results",
    stats: [
      {
        number: "500+",
        label: "Startups Launched",
        description: "Successfully deployed to production"
      },
      {
        number: "3 months",
        label: "Time Saved",
        description: "Average development time reduction"
      },
      {
        number: "99.9%",
        label: "Uptime",
        description: "Reliable, production-tested code"
      },
      {
        number: "$2M+",
        label: "Revenue Generated",
        description: "By our customers using this boilerplate"
      }
    ]
  },

  cta: {
    title: "Ready to Build Your Next Big Thing?",
    description: "Join hundreds of successful startups who chose to focus on their product instead of rebuilding the same infrastructure.",
    primaryCTA: "Start Building Today",
    secondaryCTA: "Schedule a Demo"
  },

  faq: {
    title: "Frequently Asked Questions",
    description: "Everything you need to know about our boilerplate and how it can help you launch faster.",
    questions: [
      {
        question: "What technologies are included in the boilerplate?",
        answer: "Our boilerplate uses modern, production-tested technologies: React with TypeScript, Material-UI for the frontend; FastAPI with Python for the backend; PostgreSQL for the database; Redis for caching; Docker for containerization; and comprehensive tooling for development and deployment."
      },
      {
        question: "How long does it take to set up and deploy?",
        answer: "Most developers can have the boilerplate running locally within 30 minutes following our detailed setup guide. Deployment to production typically takes 1-2 hours, including environment configuration and DNS setup."
      },
      {
        question: "Do I get lifetime updates?",
        answer: "Yes! All plans include lifetime updates. As we improve the boilerplate, add new features, and fix any issues, you'll automatically get access to all updates at no additional cost."
      },
      {
        question: "What kind of support do you provide?",
        answer: "We provide comprehensive documentation, video tutorials, and community support for all plans. Pro and Enterprise plans also include priority email support with guaranteed response times."
      },
      {
        question: "Can I customize the code for my specific needs?",
        answer: "Absolutely! You get the complete source code with no restrictions. The codebase is well-documented and modular, making it easy to customize, extend, or integrate with your existing systems."
      },
      {
        question: "Is the code production-ready?",
        answer: "Yes, the boilerplate is built with production deployment in mind. It includes proper error handling, security best practices, performance optimizations, monitoring setup, and has been battle-tested by hundreds of live applications."
      }
    ]
  }
}; 