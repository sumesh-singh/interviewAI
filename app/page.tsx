import HeroSection from "../hero-section"
import Header from "@/components/header"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"
import { OfflineIndicator } from "@/components/offline-indicator"

export default function Page() {
  return (
    <div>
      <OfflineIndicator />
      <Header />
      <HeroSection />
      <PWAInstallPrompt />
    </div>
  )
}
