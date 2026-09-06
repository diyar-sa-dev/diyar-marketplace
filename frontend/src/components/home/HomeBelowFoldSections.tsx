import {
  SummerBanner2,
  ServicesSection,
  ShopByRoom,
  NewArrivals,
  FeaturedStores,
  SummerBanner,
  WhyChooseDiyar,
  BestSellers,
  AIBanner,
  StyleFilter,
  SuggestedForYou,
  LoyaltyPromo,
  PartnerBanner,
  BrandsStrip,
  Reviews,
  DesignBlog,
  AppPromo,
  Newsletter,
} from './Sections.tsx';

/** Below-the-fold homepage sections in a single chunk (avoids 17 separate lazy requests). */
export function HomeBelowFoldSections() {
  return (
    <>
      <SummerBanner2 />
      <ServicesSection />
      <ShopByRoom />
      <NewArrivals />
      <FeaturedStores />
      <SummerBanner />
      <WhyChooseDiyar />
      <BestSellers />
      <AIBanner />
      <StyleFilter />
      <SuggestedForYou />
      <LoyaltyPromo />
      <PartnerBanner />
      <BrandsStrip />
      <Reviews />
      <DesignBlog />
      <AppPromo />
      <Newsletter />
    </>
  );
}
