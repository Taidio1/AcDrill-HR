import { MapPin } from 'lucide-react';

import { formatLocationText, locationMapUrl } from '@/src/lib/format';
import type { LocationPoint } from '@/src/types/entities';

interface LocationLineProps {
  point?: LocationPoint;
  className?: string;
  iconSize?: number;
  showIcon?: boolean;
  emptyText?: string;
}

export function LocationLine({
  point,
  className,
  iconSize = 12,
  showIcon = true,
  emptyText = 'Brak',
}: LocationLineProps) {
  const url = locationMapUrl(point);
  const text = point ? formatLocationText(point) : emptyText;
  const icon = showIcon ? (
    <MapPin size={iconSize} className="shrink-0 text-orange" />
  ) : null;
  const cls = `flex items-center gap-1 truncate ${className ?? ''}`.trim();

  if (!url) {
    return (
      <span className={cls}>
        {icon}
        {text}
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${cls} underline-offset-2 hover:underline`}
      onClick={(event) => event.stopPropagation()}
    >
      {icon}
      {text}
    </a>
  );
}
