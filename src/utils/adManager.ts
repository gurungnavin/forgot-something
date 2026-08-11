import { InterstitialAd } from "react-native-google-mobile-ads";

// TODO: swap to real ID before production
const AD_UNIT_ID = "ca-app-pub-3940256099942544/4411468910";

export const interstitial = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
  requestNonPersonalizedAdsOnly: true,
});