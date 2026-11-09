import { useState, type ReactNode } from 'react';
import { imageSources } from '../data/images';

interface Props {
  id: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  eager?: boolean;
  fallback: ReactNode;
}

/** Self-hosted, responsive AVIF/WebP. Falls back to an illustration if the file is absent or fails. */
export function Photo({ id, alt, className, sizes = '(max-width: 720px) 100vw, 50vw', eager, fallback }: Props) {
  const [failed, setFailed] = useState(false);
  const src = imageSources(id);
  if (!src || failed) return <>{fallback}</>;
  return (
    <picture className={className}>
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
  );
}
