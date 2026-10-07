'use client';

import React from 'react';
import Image from 'next/image';

export type BrandLogoVariant =
  | 'default'
  | 'on-dark'
  | 'on-light'
  | 'white'
  | 'badge-light'
  | 'badge-dark'
  | 'badge-glass';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  alt?: string;
  href?: string;
}

const SIZE_CONFIGS: Record<BrandLogoSize, { height: number; width: number; classNames: string }> = {
  xs: { height: 20, width: 78, classNames: 'h-5 w-auto' },
  sm: { height: 26, width: 102, classNames: 'h-6.5 w-auto' },
  md: { height: 34, width: 133, classNames: 'h-8.5 w-auto' },
  lg: { height: 44, width: 172, classNames: 'h-11 w-auto' },
  xl: { height: 56, width: 219, classNames: 'h-14 w-auto' },
};

export function BrandLogo({
  variant = 'default',
  size = 'md',
  className = '',
  imgClassName = '',
  priority = false,
  alt = 'GTS Ghar Tak Service',
}: BrandLogoProps) {
  const sizeConfig = SIZE_CONFIGS[size];

  // Pick optimal asset based on background variant
  let src = '/logo-gts.png';
  let containerWrapper = '';

  switch (variant) {
    case 'on-dark':
      src = '/logo-gts-dark-bg.png';
      break;
    case 'on-light':
      src = '/logo-gts-light-bg.png';
      break;
    case 'white':
      src = '/logo-gts-white.png';
      break;
    case 'badge-light':
      src = '/logo-gts-light-bg.png';
      containerWrapper = 'inline-flex items-center justify-center px-3 py-1.5 rounded-2xl bg-white shadow-sm border border-slate-200/90';
      break;
    case 'badge-dark':
      src = '/logo-gts-dark-bg.png';
      containerWrapper = 'inline-flex items-center justify-center px-3 py-1.5 rounded-2xl bg-slate-900/95 shadow-md border border-slate-700/80 backdrop-blur-md';
      break;
    case 'badge-glass':
      src = '/logo-gts-dark-bg.png';
      containerWrapper = 'inline-flex items-center justify-center px-3 py-1.5 rounded-2xl bg-white/15 shadow-inner border border-white/25 backdrop-blur-md';
      break;
    default:
      src = '/logo-gts.png';
      break;
  }

  const imageElement = (
    <img
      src={src}
      alt={alt}
      width={sizeConfig.width}
      height={sizeConfig.height}
      className={`object-contain transition-all duration-200 ${sizeConfig.classNames} ${imgClassName}`}
      loading={priority ? 'eager' : 'lazy'}
    />
  );

  if (containerWrapper) {
    return (
      <div className={`${containerWrapper} ${className}`}>
        {imageElement}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center ${className}`}>
      {imageElement}
    </div>
  );
}

/**
 * Compact Icon Mark (The GTS trolley delivery speed icon mark)
 * Ideal for avatar squares, top app bars, mobile headers, and icon placeholders.
 */
export type BrandMarkSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type BrandMarkVariant = 'default' | 'dark' | 'light' | 'white';

interface BrandMarkProps {
  size?: BrandMarkSize;
  variant?: BrandMarkVariant;
  className?: string;
  imgClassName?: string;
  badge?: boolean;
  badgeBg?: string;
  alt?: string;
}

const MARK_SIZES: Record<BrandMarkSize, { sizePx: number; imgSizePx: number; classNames: string }> = {
  xs: { sizePx: 24, imgSizePx: 18, classNames: 'w-6 h-6' },
  sm: { sizePx: 32, imgSizePx: 24, classNames: 'w-8 h-8' },
  md: { sizePx: 40, imgSizePx: 30, classNames: 'w-10 h-10' },
  lg: { sizePx: 48, imgSizePx: 36, classNames: 'w-12 h-12' },
  xl: { sizePx: 64, imgSizePx: 48, classNames: 'w-16 h-16' },
};

export function BrandMark({
  size = 'md',
  variant = 'default',
  className = '',
  imgClassName = '',
  badge = true,
  badgeBg,
  alt = 'GTS Mark',
}: BrandMarkProps) {
  const conf = MARK_SIZES[size];

  let src = '/logo-gts-mark.png';
  if (variant === 'dark') {
    src = '/logo-gts-mark-dark.png';
  } else if (variant === 'white') {
    src = '/logo-gts-white.png';
  }

  const img = (
    <img
      src={src}
      alt={alt}
      width={conf.imgSizePx}
      height={Math.round(conf.imgSizePx * 0.64)}
      className={`object-contain ${imgClassName}`}
    />
  );

  if (!badge) {
    return <div className={`inline-flex items-center justify-center ${className}`}>{img}</div>;
  }

  const defaultBg = badgeBg || 'bg-white shadow-sm border border-slate-200/80';

  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl overflow-hidden shrink-0 transition-transform duration-200 ${conf.classNames} ${defaultBg} ${className}`}
    >
      {img}
    </div>
  );
}
