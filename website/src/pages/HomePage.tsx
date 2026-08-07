import React from "react";
import { HeroSection } from "../components/HeroSection";
import { FeaturesSection } from "../components/FeaturesSection";
import { LiveServiceSection } from "../components/LiveServiceSection";
import { MinistriesSection } from "../components/MinistriesSection";
import { SermonSection } from "../components/SermonSection";
import { LeadershipSection } from "../components/LeadershipSection";
import { GivingSection } from "../components/GivingSection";
import { TestimonialsSection } from "../components/TestimonialSection";
import { DownloadSection } from "../components/DownloadSection";
import { PageLayout } from "../components/Layout";
import { ScrollReveal } from "../components/ScrollReveal";

// Types
interface HomePageProps {
  className?: string;
}

// SEO metadata
const PAGE_METADATA = {
  title: "My Church - Connected Digital Church Ecosystem",
  description: "Join 2,400+ churches using My Church to connect their congregation through live services, giving, ministry tools, and more.",
  sections: [
    "hero",
    "features", 
    "live-service",
    "ministries",
    "sermon",
    "leadership", 
    "giving",
    "testimonials",
    "download"
  ] as const,
} as const;

// Custom hook for page analytics
const usePageAnalytics = (): void => {
  React.useEffect(() => {
    // Track page view
    const trackPageView = (): void => {
      console.log("Homepage viewed"); // Replace with actual analytics
      
      // Example: Google Analytics
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'page_view', {
          page_title: PAGE_METADATA.title,
          page_location: window.location.href,
        });
      }
    };

    trackPageView();
  }, []);
};

// Section wrapper for consistent layout
const SectionWrapper: React.FC<{ id: string; children: React.ReactNode }> = React.memo(({ 
  id, 
  children 
}) => {
  return (
    <section id={id} aria-labelledby={`${id}-heading`}>
      <span id={`${id}-heading`} className="sr-only">
        {id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ")}
      </span>
      {children}
    </section>
  );
});

SectionWrapper.displayName = "SectionWrapper";

// Main Component
const HomePage: React.FC<HomePageProps> = ({ className }) => {
  usePageAnalytics();

  // Scroll to hash on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  return (
    <PageLayout>
      <div className={className} role="main" aria-label="Home page content">
        <ScrollReveal as="div" delay={0}>
          <HeroSection />
        </ScrollReveal>
        <ScrollReveal as="div" delay={80}>
          <FeaturesSection />
        </ScrollReveal>
        <ScrollReveal as="div" delay={80}>
          <LiveServiceSection />
        </ScrollReveal>
        <ScrollReveal as="div" delay={80}>
          <MinistriesSection />
        </ScrollReveal>
        <ScrollReveal as="div" delay={80}>
          <SermonSection />
        </ScrollReveal>
        <ScrollReveal as="div" delay={80}>
          <LeadershipSection />
        </ScrollReveal>
        <ScrollReveal as="div" delay={80}>
          <GivingSection />
        </ScrollReveal>
        <ScrollReveal as="div" delay={80}>
          <TestimonialsSection />
        </ScrollReveal>
        <ScrollReveal as="div" delay={80}>
          <DownloadSection />
        </ScrollReveal>
      </div>
    </PageLayout>
  );
};

// Export the component and its types
export default React.memo(HomePage);
export type { HomePageProps };