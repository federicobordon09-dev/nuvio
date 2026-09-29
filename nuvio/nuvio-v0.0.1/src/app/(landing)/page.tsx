import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBand from "@/components/TrustBand";
import HowItWorks from "@/components/HowItWorks";
import StudyTypes from "@/components/StudyTypes";
import ClarityComparison from "@/components/ClarityComparison";
import Security from "@/components/Security";
import Disclaimer from "@/components/Disclaimer";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TrustBand />
        <HowItWorks />
        <StudyTypes />
        <ClarityComparison />
        <Security />
        <Disclaimer />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
