'use client';
import { useSahYog } from '@/store/useSahYog';

export default function Lightbox() {
  const { state, dispatch } = useSahYog();
  const { lightboxPhotos, lightboxIndex } = state;
  const photos = lightboxPhotos.filter(p => !p.isVideo);

  if (photos.length === 0) return null;

  return (
    <div className="lightbox show">
      <button className="lb-close" onClick={() => dispatch({ type: 'CLOSE_LIGHTBOX' })}>✕</button>
      <button className="lb-nav lb-prev" onClick={() => dispatch({ type: 'LB_NAV', dir: -1 })}>‹</button>
      <img src={photos[lightboxIndex]?.src ?? ''} alt="Evidence photo, enlarged" />
      <button className="lb-nav lb-next" onClick={() => dispatch({ type: 'LB_NAV', dir: 1 })}>›</button>
    </div>
  );
}
