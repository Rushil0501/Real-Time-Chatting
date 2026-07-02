export function PresenceDot({ online }) {
  return <span className={`presence-dot${online ? ' online' : ''}`} />;
}
