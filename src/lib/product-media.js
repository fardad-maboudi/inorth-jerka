/**
 * Curated editorial product photography catalog for JERKA.
 * Provides high-resolution Unsplash photography with secondary hover images
 * when products lack photography or use interim seed SVGs.
 */

export const PRODUCT_MEDIA_FALLBACKS = {
  'wood-frame': {
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=80&auto=format&fit=crop',
  },
  'wicker-basket': {
    image: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80&auto=format&fit=crop',
  },
  'table-mirror': {
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&q=80&auto=format&fit=crop',
  },
  'linen-tablecloth': {
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?w=800&q=80&auto=format&fit=crop',
  },
  'wall-print': {
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80&auto=format&fit=crop',
  },
  'small-vase': {
    image: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&q=80&auto=format&fit=crop',
  },
  'scented-candle': {
    image: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1605651202774-7d573fd3f12d?w=800&q=80&auto=format&fit=crop',
  },
  'fabric-cushion': {
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&auto=format&fit=crop',
  },
  'wood-coaster': {
    image: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80&auto=format&fit=crop',
  },
  'simple-headphone': {
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80&auto=format&fit=crop',
  },
  'pocket-powerbank': {
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&q=80&auto=format&fit=crop',
  },
  'desk-lamp': {
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80&auto=format&fit=crop',
  },
  'storage-box': {
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1595079672139-2a71d87e0407?w=800&q=80&auto=format&fit=crop',
  },
  'metal-keychain': {
    image: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80&auto=format&fit=crop',
  },
  'desk-clock': {
    image: 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800&q=80&auto=format&fit=crop',
  },
  'ceramic-mug': {
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80&auto=format&fit=crop',
  },
  'mouse-pad': {
    image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&q=80&auto=format&fit=crop',
  },
  'double-wall-glass': {
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&q=80&auto=format&fit=crop',
  },
  'cotton-socks': {
    image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=800&q=80&auto=format&fit=crop',
  },
  'leather-cardholder': {
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80&auto=format&fit=crop',
  },
  'hardcover-notebook': {
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=800&q=80&auto=format&fit=crop',
  },
  'steel-bottle': {
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80&auto=format&fit=crop',
  },
  'cotton-scarf': {
    image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80&auto=format&fit=crop',
  },
  'daily-bag': {
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80&auto=format&fit=crop',
    hoverImage: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80&auto=format&fit=crop',
  },
};

/**
 * Resolves the primary matching fallback entry for a product by slug or title keywords.
 */
export function getProductFallbackMedia(product) {
  if (!product) return null;
  const key = product.slug || product.productId || product.id;
  if (key && PRODUCT_MEDIA_FALLBACKS[key]) {
    return PRODUCT_MEDIA_FALLBACKS[key];
  }

  const title = product.title || '';
  if (title.includes('قاب')) return PRODUCT_MEDIA_FALLBACKS['wood-frame'];
  if (title.includes('حصیری') || title.includes('سبد')) return PRODUCT_MEDIA_FALLBACKS['wicker-basket'];
  if (title.includes('آینه')) return PRODUCT_MEDIA_FALLBACKS['table-mirror'];
  if (title.includes('رومیزی') || title.includes('کتان')) return PRODUCT_MEDIA_FALLBACKS['linen-tablecloth'];
  if (title.includes('چاپ') || title.includes('تابلو') || title.includes('دیواری')) return PRODUCT_MEDIA_FALLBACKS['wall-print'];
  if (title.includes('گلدان')) return PRODUCT_MEDIA_FALLBACKS['small-vase'];
  if (title.includes('شمع')) return PRODUCT_MEDIA_FALLBACKS['scented-candle'];
  if (title.includes('کوسن') || title.includes('بالش')) return PRODUCT_MEDIA_FALLBACKS['fabric-cushion'];
  if (title.includes('ماگ') || title.includes('فنجان')) return PRODUCT_MEDIA_FALLBACKS['ceramic-mug'];
  if (title.includes('جاکارتی') || title.includes('کیف پول')) return PRODUCT_MEDIA_FALLBACKS['leather-cardholder'];
  if (title.includes('شال') || title.includes('روسری')) return PRODUCT_MEDIA_FALLBACKS['cotton-scarf'];
  if (title.includes('کیف')) return PRODUCT_MEDIA_FALLBACKS['daily-bag'];
  if (title.includes('دفتر') || title.includes('کتاب')) return PRODUCT_MEDIA_FALLBACKS['hardcover-notebook'];
  if (title.includes('ساعت')) return PRODUCT_MEDIA_FALLBACKS['desk-clock'];
  if (title.includes('چراغ') || title.includes('آباژور')) return PRODUCT_MEDIA_FALLBACKS['desk-lamp'];
  if (title.includes('زیرلیوانی')) return PRODUCT_MEDIA_FALLBACKS['wood-coaster'];
  if (title.includes('بطری') || title.includes('قمقمه')) return PRODUCT_MEDIA_FALLBACKS['steel-bottle'];
  if (title.includes('هدفون')) return PRODUCT_MEDIA_FALLBACKS['simple-headphone'];
  if (title.includes('پاوربانک')) return PRODUCT_MEDIA_FALLBACKS['pocket-powerbank'];
  if (title.includes('جعبه')) return PRODUCT_MEDIA_FALLBACKS['storage-box'];
  if (title.includes('جاکلیدی')) return PRODUCT_MEDIA_FALLBACKS['metal-keychain'];
  if (title.includes('پد ماوس')) return PRODUCT_MEDIA_FALLBACKS['mouse-pad'];
  if (title.includes('لیوان')) return PRODUCT_MEDIA_FALLBACKS['double-wall-glass'];
  if (title.includes('جوراب')) return PRODUCT_MEDIA_FALLBACKS['cotton-socks'];

  return null;
}

const DEFAULT_MEDIA_FALLBACK = {
  image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80&auto=format&fit=crop',
  hoverImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80&auto=format&fit=crop',
};

const isSeedImage = (src, product) =>
  !src ||
  typeof src !== 'string' ||
  src.startsWith('data:image/svg') ||
  src.includes('svg+xml') ||
  src.includes('.svg') ||
  src.includes('placeholder') ||
  product?.mediaProvenance === 'interim_seed';

/**
 * Resolves main and hover images for a product, prioritizing real external image URLs
 * and falling back gracefully to curated high-resolution editorial photography.
 */
export function resolveProductMedia(product) {
  if (!product) return { image: null, hoverImage: null };

  const rawImage = product.images?.[0] || product.image;
  const rawHover = product.images?.[1];

  // If the product already has a real external photograph
  if (rawImage && !isSeedImage(rawImage, product)) {
    return {
      image: rawImage,
      hoverImage: rawHover && !isSeedImage(rawHover, product) ? rawHover : null,
    };
  }

  const fallback = getProductFallbackMedia(product) || DEFAULT_MEDIA_FALLBACK;
  return {
    image: fallback.image,
    hoverImage: fallback.hoverImage || null,
  };
}

/**
 * Resolves all available images for a product gallery (including variant selection),
 * prioritizing real photographs and falling back to curated editorial photography.
 * Guaranteed to return an array of valid image URLs.
 */
export function resolveProductGallery(product, variant = null) {
  if (!product) return [];

  const rawList = [];

  // Variant image takes highest priority if available
  if (variant?.image && typeof variant.image === 'string' && !isSeedImage(variant.image, product)) {
    rawList.push(variant.image);
  }

  // Next, gather all images from product.images array
  if (Array.isArray(product.images)) {
    for (const img of product.images) {
      if (img && typeof img === 'string' && !rawList.includes(img)) {
        rawList.push(img);
      }
    }
  } else if (typeof product.images === 'string' && !rawList.includes(product.images)) {
    rawList.push(product.images);
  }

  // Also include single product.image if present
  if (product.image && typeof product.image === 'string' && !rawList.includes(product.image)) {
    rawList.push(product.image);
  }

  // Filter out any seed or SVG placeholders
  const validRealImages = rawList.filter((src) => !isSeedImage(src, product));

  if (validRealImages.length > 0) {
    return validRealImages;
  }

  // If no real external images exist, look up editorial photography fallback
  const fallback = getProductFallbackMedia(product) || DEFAULT_MEDIA_FALLBACK;
  const editorialList = [];

  if (variant?.image && typeof variant.image === 'string' && !isSeedImage(variant.image, product)) {
    editorialList.push(variant.image);
  }
  if (fallback.image && !editorialList.includes(fallback.image)) {
    editorialList.push(fallback.image);
  }
  if (fallback.hoverImage && !editorialList.includes(fallback.hoverImage)) {
    editorialList.push(fallback.hoverImage);
  }

  return editorialList.length > 0 ? editorialList : [DEFAULT_MEDIA_FALLBACK.image, DEFAULT_MEDIA_FALLBACK.hoverImage];
}
