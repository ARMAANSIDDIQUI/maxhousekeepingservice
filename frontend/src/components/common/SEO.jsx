import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useBooking } from '../../context/BookingContext';

export default function SEO({
  title,
  description,
  keywords,
  image = '/favicon.png',
  url,
  type = 'website',
  customSchema = null
}) {
  const bookingCtx = useBooking();
  const settings = bookingCtx?.settings || {};

  const brand = settings.brandName || settings.businessName || 'Max Housekeeping Service';
  const defaultDesc = settings.tagline || settings.heroCopy || 'Professional housekeeping and cleaning services.';
  const currentPhone = settings.phone || settings.primaryPhone || '';
  const currentEmail = settings.email || settings.supportEmail || '';
  const currentAddress = settings.address || '';
  const currentInstagram = settings.instagramUrl || '';

  const pageTitle = title
    ? (title.includes(brand) ? title : `${title} | ${brand}`)
    : `${brand} | Professional Cleaning Services`;

  const metaDesc = description || defaultDesc;
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Schema.org LocalBusiness structured data strictly using actual database settings
  const defaultSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': brand,
    ...(currentPhone ? { 'telephone': currentPhone } : {}),
    ...(currentEmail ? { 'email': currentEmail } : {}),
    ...(currentAddress ? {
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': currentAddress
      }
    } : {}),
    ...(currentInstagram ? {
      'sameAs': [currentInstagram]
    } : {})
  };

  const schemaToInject = customSchema || defaultSchema;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      {currentUrl && <link rel="canonical" href={currentUrl} />}

      {/* Open Graph / Social Sharing */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDesc} />
      {image && <meta property="og:image" content={image} />}
      {currentUrl && <meta property="og:url" content={currentUrl} />}
      <meta property="og:site_name" content={brand} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDesc} />
      {image && <meta name="twitter:image" content={image} />}

      {/* Search Engine Crawlers */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content={brand} />

      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(schemaToInject)}
      </script>
    </Helmet>
  );
}
