/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { WardrobeItem } from '../types';

/**
 * Secret Affiliate Program Configuration
 * Paste your affiliate IDs or tracking tags here when ready.
 * The UI never exposes the raw tag strings to the client, keeping it secret.
 */
export const AFFILIATE_SETTINGS = {
  // Amazon Associates Tag (e.g. "sabhyamai-21")
  amazonTag: '',
  // Flipkart Affiliate Tracking ID
  flipkartAffiliateId: '',
  // Myntra Affiliate / Partner Code
  myntraAffiliateCode: '',
};

/**
 * Generate discrete, clean shopping link to Amazon, Flipkart, or Myntra
 */
export const getShoppingUrl = (
  item: WardrobeItem,
  store: 'amazon' | 'flipkart' | 'myntra' = 'amazon'
): string => {
  if (item.customAffiliateUrl) {
    return item.customAffiliateUrl;
  }

  const query = encodeURIComponent(item.searchQuery || `${item.name} baggy streetwear`);

  switch (store) {
    case 'amazon': {
      const baseUrl = `https://www.amazon.in/s?k=${query}`;
      return AFFILIATE_SETTINGS.amazonTag
        ? `${baseUrl}&tag=${AFFILIATE_SETTINGS.amazonTag}`
        : baseUrl;
    }
    case 'flipkart': {
      const baseUrl = `https://www.flipkart.com/search?q=${query}`;
      return AFFILIATE_SETTINGS.flipkartAffiliateId
        ? `${baseUrl}&affid=${AFFILIATE_SETTINGS.flipkartAffiliateId}`
        : baseUrl;
    }
    case 'myntra': {
      const myntraSlug = encodeURIComponent(
        (item.searchQuery || item.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')
      );
      const baseUrl = `https://www.myntra.com/${myntraSlug}`;
      return AFFILIATE_SETTINGS.myntraAffiliateCode
        ? `${baseUrl}?utm_source=${AFFILIATE_SETTINGS.myntraAffiliateCode}`
        : baseUrl;
    }
    default:
      return `https://www.amazon.in/s?k=${query}`;
  }
};
