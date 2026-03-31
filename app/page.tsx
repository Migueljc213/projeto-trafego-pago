import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProblemSection from "@/components/ProblemSection";
import ComparisonSection from "@/components/ComparisonSection";
import SimulatorSection from "@/components/SimulatorSection";
import WhiteGloveSection from "@/components/WhiteGloveSection";
import WaitlistSection from "@/components/WaitlistSection";

export default function HomePage() {
  return (
    <main className="relative overflow-x-hidden">
      <Header />
      <HeroSection />
      <ProblemSection />
      <ComparisonSection />
      <SimulatorSection />
      <WhiteGloveSection />
      <WaitlistSection />
    </main>
  );
}
