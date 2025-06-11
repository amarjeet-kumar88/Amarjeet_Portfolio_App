'use client';
import { personalData } from "@/utils/data/personal-data";
import AboutSection from "./components/homepage/about";
import Blog from "./components/homepage/blog";
import ContactSection from "./components/homepage/contact";
import Education from "./components/homepage/education";
import Experience from "./components/homepage/experience";
import HeroSection from "./components/homepage/hero-section";
import Projects from "./components/homepage/projects";
import Skills from "./components/homepage/skills";

// ✅ Marking this as server-side fetch logic
async function getData() {
  try {
    const res = await fetch(`https://dev.to/api/articles?username=${personalData.devUsername}`, {
      // 👇 Important for server-side fetch in production (Vercel)
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch blog data');
    }

    const data = await res.json();
    return data
      .filter((item) => item?.cover_image)
      .sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error("Error fetching blog data:", error);
    return []; // fallback to empty list
  }
}

// ✅ This is a server component
export default async function Home() {
  const blogs = await getData();

  return (
    <div suppressHydrationWarning>
      <HeroSection />
      <AboutSection />
      <Experience />
      <Skills />
      <Projects />
      <Education />
      <Blog blogs={blogs} />
      <ContactSection />
    </div>
  );
}
