import React, { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

// Types
interface PageLayoutProps {
  children: ReactNode;
}

interface PageHeroProps {
  badge?: string;
  badgeColor?: string;
  title: ReactNode;
  subtitle?: string;
  dark?: boolean;
}

interface HeroSectionStyles {
  sectionStyle: React.CSSProperties;
  badgeStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  subtitleStyle: React.CSSProperties;
}

interface DarkThemeConfig extends HeroSectionStyles {
  isDark: true;
  gradientOverlay?: React.CSSProperties;
}

interface LightThemeConfig extends HeroSectionStyles {
  isDark: false;
}

type ThemeConfig = DarkThemeConfig | LightThemeConfig;

// Constants
const DEFAULT_BADGE_COLOR = "var(--church-gold)";

// Helper functions
const getThemeConfig = (dark: boolean, badgeColor: string): ThemeConfig => {
  if (dark) {
    return {
      isDark: true,
      sectionStyle: {
        background: "linear-gradient(135deg, #0B1A40 0%, #1B3A7A 60%, #0F2455 100%)",
      },
      badgeStyle: {
        background: "rgba(200,150,44,0.15)",
        border: "1px solid rgba(200,150,44,0.3)",
        color: badgeColor,
      },
      titleStyle: {
        color: "#fff",
        fontFamily: "var(--font-display)",
        fontSize: "clamp(2rem, 5vw, 3.5rem)",
        fontWeight: 700,
        lineHeight: 1.15,
      },
      subtitleStyle: {
        color: "rgba(255,255,255,0.6)",
        fontSize: "1.125rem",
        lineHeight: 1.625,
      },
      gradientOverlay: {
        backgroundImage: "radial-gradient(ellipse 70% 60% at 50% 80%, rgba(200,150,44,0.1) 0%, transparent 70%)",
      },
    };
  }

  return {
    isDark: false,
    sectionStyle: {
      background: "var(--background)",
    },
    badgeStyle: {
      background: "rgba(27,58,122,0.08)",
      border: "1px solid rgba(27,58,122,0.15)",
      color: "var(--church-blue)",
    },
    titleStyle: {
      color: "var(--foreground)",
      fontFamily: "var(--font-display)",
      fontSize: "clamp(2rem, 5vw, 3.5rem)",
      fontWeight: 700,
      lineHeight: 1.15,
    },
    subtitleStyle: {
      color: "var(--muted-foreground)",
      fontSize: "1.125rem",
      lineHeight: 1.625,
    },
  };
};

// Components
const HeroBadge: React.FC<{ badge: string; style: React.CSSProperties }> = ({ badge, style }) => {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-sm font-medium"
      style={style}
      role="banner"
      aria-label={badge}
    >
      {badge}
    </div>
  );
};

const HeroTitle: React.FC<{ title: ReactNode; style: React.CSSProperties }> = ({ title, style }) => {
  return (
    <h1
      className="mb-5"
      style={style}
    >
      {title}
    </h1>
  );
};

const HeroSubtitle: React.FC<{ subtitle: string; style: React.CSSProperties }> = ({ subtitle, style }) => {
  return (
    <p className="text-lg leading-relaxed max-w-2xl mx-auto" style={style}>
      {subtitle}
    </p>
  );
};

const DarkGradientOverlay: React.FC = () => {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 70% 60% at 50% 80%, rgba(200,150,44,0.1) 0%, transparent 70%)",
      }}
      aria-hidden="true"
    />
  );
};

const BottomGradient: React.FC = () => {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
      style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
      aria-hidden="true"
    />
  );
};

// Main Components
export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mainElement = document.querySelector('main');

    if (!mainElement) return;

    const sections = Array.from(mainElement.querySelectorAll('section')) as HTMLElement[];

    if (sections.length === 0) return;

    if (reduceMotionQuery.matches) {
      sections.forEach((section) => {
        section.classList.remove('opacity-0', 'translate-y-8');
        section.classList.add('opacity-100', 'translate-y-0');
      });
      return;
    }

    sections.forEach((section) => {
      if (section.getAttribute('data-reveal') === 'true') return;

      section.setAttribute('data-reveal', 'true');
      section.classList.add('opacity-0', 'translate-y-8', 'transition-all', 'duration-700', 'ease-out');
      section.style.willChange = 'opacity, transform';
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('opacity-0', 'translate-y-8');
            entry.target.classList.add('opacity-100', 'translate-y-0');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -5% 0px',
      }
    );

    sections.forEach((section) => {
      if (section.getAttribute('data-reveal') === 'true') {
        observer.observe(section);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      className="min-h-screen" 
      style={{ 
        fontFamily: "var(--font-body)", 
        background: "var(--background)" 
      }}
    >
      <Navbar />
      <main role="main">{children}</main>
      <Footer />
    </div>
  );
};

export const PageHero: React.FC<PageHeroProps> = ({
  badge,
  badgeColor = DEFAULT_BADGE_COLOR,
  title,
  subtitle,
  dark = true,
}) => {
  const themeConfig: ThemeConfig = getThemeConfig(dark, badgeColor);

  if (dark) {
    const darkConfig = themeConfig as DarkThemeConfig;
    
    return (
      <section
        className="relative pt-32 pb-20 overflow-hidden"
        style={darkConfig.sectionStyle}
        aria-labelledby="page-hero-heading-dark"
      >
        <DarkGradientOverlay />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <span id="page-hero-heading-dark" className="sr-only">
            {typeof title === 'string' ? title : 'Hero Section'}
          </span>
          
          {badge && <HeroBadge badge={badge} style={darkConfig.badgeStyle} />}
          
          <HeroTitle title={title} style={darkConfig.titleStyle} />
          
          {subtitle && <HeroSubtitle subtitle={subtitle} style={darkConfig.subtitleStyle} />}
        </div>
        
        <BottomGradient />
      </section>
    );
  }

  const lightConfig = themeConfig as LightThemeConfig;
  
  return (
    <section 
      className="pt-32 pb-16" 
      style={lightConfig.sectionStyle}
      aria-labelledby="page-hero-heading-light"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <span id="page-hero-heading-light" className="sr-only">
          {typeof title === 'string' ? title : 'Hero Section'}
        </span>
        
        {badge && <HeroBadge badge={badge} style={lightConfig.badgeStyle} />}
        
        <HeroTitle title={title} style={lightConfig.titleStyle} />
        
        {subtitle && <HeroSubtitle subtitle={subtitle} style={lightConfig.subtitleStyle} />}
      </div>
    </section>
  );
};

// Default export
export default PageLayout;