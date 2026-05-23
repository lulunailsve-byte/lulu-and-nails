import { Hero } from "@/components/landing/Hero";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { ScheduleSection } from "@/components/landing/ScheduleSection";
import { FooterSection } from "@/components/landing/FooterSection";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { BookingExpress } from "@/components/booking/BookingExpress";

export default function HomePage() {
  return (
    <main className="bg-warm-white pb-10">
      <Hero />
      <BookingExpress />
      <ServicesSection />
      <ScheduleSection />
      <FooterSection />
      <WhatsAppFloat />
    </main>
  );
}
