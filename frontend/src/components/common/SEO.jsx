import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({
  title = 'Max Housekeeping Service | Professional Cleaning in Western UP',
  description = 'Top-rated home deep cleaning, bathroom sanitisation, kitchen degreasing, sofa shampooing & commercial cleaning across Moradabad, Rampur, Amroha, Sambhal, and Western Uttar Pradesh.',
  keywords = 'home cleaning, deep cleaning, sofa dry cleaning, floor cleaning, bathroom sanitization, kitchen cleaning, Moradabad cleaning, Rampur cleaning, Sambhal cleaning, Amroha cleaning, housekeeping service Western UP',
  image = '/favicon.png',
  url = typeof window !== 'undefined' ? window.location.href : 'https://maxhousekeeping.in',
  type = 'website'
}) {
  const fullTitle = title.includes('Max Housekeeping') ? title : `${title} | Max Housekeeping Service`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Social Sharing */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Max Housekeeping Service" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Search Engine Crawlers */}
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Max Housekeeping Service" />
    </Helmet>
  );
}
