import { useEffect } from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Hero from "@/components/Hero";
import Benefits from "@/components/Benefits";
import HowItWorks from "@/components/HowItWorks";
import Demo from "@/components/Demo";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/layout/Footer";

export default function Home() {
  useEffect(() => {
    // Set page title
    document.title = "Prontu.live - Transforme sua consulta médica com IA em tempo real";
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Header />
      <main className="pt-16">
        <Hero />
        <Benefits />
        <HowItWorks />
        <Demo />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </motion.div>
  );
}
