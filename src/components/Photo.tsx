import { useState, type ReactNode } from 'react';
import { creditFor, imageSources } from '../data/images';
import './photo.css';

interface Props {
  id: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
  fallback: ReactNode;
}

/**
 * Self-hosted, responsive AVIF/WebP. Falls back to an illustration if the file is absent or fails.
 * The Creative Commons licences require attribution, so each photo carries its own small credit.
 */
export function Photo({ id, alt, className, sizes = '(max-width: 720px) 100vw, 50vw', eager, fallback }: Props) {
  const [failed, setFailed] = useState(false);
  const src = imageSources(id);
  if (!src || failed) return <>{fallback}</>;
  const credit = creditFor(id!);
  return (
    <span className={`photo ${className ?? ''}`}>
      <picture>
        {src.avif && <source type="image/avif" srcSet={src.avif} sizes={sizes} />}
        {src.webp && <source type="image/webp" srcSet={src.webp} sizes={sizes} />}
        <img
          src={src.fallback}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </picture>
      {credit && (
        <a className="photo-credit" href={credit.pageUrl} target="_blank" rel="noreferrer">
          Photo: {credit.author}, {credit.license}
        </a>
      )}
    </span>
  );
}
