import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import Cta from "@/components/landing/Cta";
import Footer from "@/components/landing/Footer";
import TeamSection from "@/components/TeamSection";

export default function LandingPage() {
  return <main className="overflow-hidden bg-cream"><Header /><Hero /><HowItWorks /><Features /><section id="team"><TeamSection /></section><Cta /><Footer /></main>;
}
