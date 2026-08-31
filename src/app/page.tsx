import Header from "@/components/shop/header";
import Hero from "@/components/shop/hero";
import UspMarquee from "@/components/shop/usp-marquee";
import CategoryRail from "@/components/shop/category-rail";
import Bestsellers from "@/components/shop/bestsellers";
import ComboBuilder from "@/components/shop/combo-builder";
import OccasionGrid from "@/components/shop/occasion-grid";
import StatsBar from "@/components/shop/stats-bar";
import Testimonials from "@/components/shop/testimonials";
import Newsletter from "@/components/shop/newsletter";
import Footer from "@/components/shop/footer";
import CartDrawer from "@/components/shop/cart-drawer";
import LocationModal from "@/components/shop/location-modal";
import MobileNav from "@/components/shop/mobile-nav";
import SearchOverlay from "@/components/shop/search-overlay";
import ProductQuickView from "@/components/shop/product-quick-view";
import BackToTop from "@/components/shop/back-to-top";
import WishlistDrawer from "@/components/shop/wishlist-drawer";
import OrderTrackModal from "@/components/shop/order-track-modal";
import RecentlyViewed from "@/components/shop/recently-viewed";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-cream pb-[72px] md:pb-0">
      <Header />
      <main className="flex-1">
        <Hero />
        <UspMarquee />
        <CategoryRail />
        <Bestsellers />
        <ComboBuilder />
        <OccasionGrid />
        <StatsBar />
        <Testimonials />
        <RecentlyViewed />
        <Newsletter />
      </main>
      <Footer />

      {/* Overlays */}
      <CartDrawer />
      <WishlistDrawer />
      <LocationModal />
      <SearchOverlay />
      <ProductQuickView />
      <OrderTrackModal />
      <BackToTop />
      <MobileNav />
    </div>
  );
}
