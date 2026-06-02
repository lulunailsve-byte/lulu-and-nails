import { Hero } from "@/components/landing/Hero";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { ScheduleSection } from "@/components/landing/ScheduleSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { BookingExpress } from "@/components/booking/BookingExpress";
import { PressOnLauncher } from "@/components/pressonn/PressOnLauncher";

export default function HomePage() {
  return (
    <main className="bg-gradient-to-b from-violet-50 via-pink-50 to-warm-white">
      <Hero />
      <BookingExpress />
      <ServicesSection />
      <ScheduleSection />
      <FooterSection />
      <WhatsAppFloat />
      <PressOnLauncher />
    </main>
  );
}
