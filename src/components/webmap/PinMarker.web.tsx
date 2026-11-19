import { memo, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type * as Leaflet from 'leaflet';
import { PulseRing } from '../motion';
import { Pin } from '../Pin';
import type { MapPin } from '../mapTypes';
import type { L } from './leaflet.web';

/** The pin's drawing, the same as the iPhone map's marker. */
export const PinFace = memo(
  function PinFace({ pin }: { pin: MapPin }) {
    const size = pin.size ?? 36;
    return pin.live ? (
      <PulseRing live colour={pin.colour} size={size} pad>
        <Pin glyph={pin.glyph} colour={pin.colour} size={size} count={pin.count} badge={pin.badge} />
      </PulseRing>
    ) : (
      <Pin glyph={pin.glyph} colour={pin.colour} size={size} count={pin.count} badge={pin.badge} />
    );
  },
  (a, b) =>
    a.pin.glyph === b.pin.glyph &&
    a.pin.colour === b.pin.colour &&
    a.pin.size === b.pin.size &&
    a.pin.live === b.pin.live &&
    a.pin.count === b.pin.count &&
    a.pin.badge === b.pin.badge,
);

/** How big a pin's box is (live pins leave room for the pulse). */
export const pinBox = (pin: MapPin) => (pin.live ? (pin.size ?? 36) * 2.2 : (pin.size ?? 36));

export const pinLabel = (pin: MapPin) => `${pin.count ? `${pin.count} ` : ''}${pin.title}${pin.live ? ', live now' : ''}${pin.count ? '. Zoom in' : ''}`;

/** One marker the map should show; its drawing is `face`, rendered into the marker's own DOM node. */
export interface MarkerSpec {
  id: string;
  lat: number;
  lng: number;
  /** Box size in px (the marker is centred on its point). */
  size: number;
  z?: number;
  label?: string;
  onClick?: () => void;
  face: ReactNode;
}

/**
 * Keeps Leaflet markers in step with `specs`. Each marker is a divIcon around a DOM node
 * the component renders into with a React portal, so pins share the app's React tree
 * (fonts, motion settings) and look exactly like the iPhone's.
 * Returns the portals to render.
 */
export function useMarkers(leaflet: { L: L; map: Leaflet.Map } | null, specs: MarkerSpec[]) {
  const hosts = useRef(new Map<string, HTMLElement>());
  const markers = useRef(new Map<string, { m: Leaflet.Marker; size: number; label?: string; z?: number; click?: () => void }>());
  const host = (id: string) => {
    let el = hosts.current.get(id);
    if (!el && typeof document !== 'undefined') {
      el = document.createElement('div');
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.transform = 'rotate(var(--ns-counter, 0deg))';
      hosts.current.set(id, el);
    }
    return el!;
  };

  const onMap = useRef<Leaflet.Map | null>(null);
  // Every render: add, move and drop markers to match `specs` (cheap: only changes touch Leaflet).
  useLayoutEffect(() => {
    if (!leaflet) return;
    const { L, map } = leaflet;
    if (onMap.current !== map) {
      markers.current.clear();
      onMap.current = map;
    }
    const live = new Set<string>();
    for (const s of specs) {
      live.add(s.id);
      const had = markers.current.get(s.id);
      if (had && had.size === s.size && had.label === s.label && !!had.click === !!s.onClick) {
        const at = had.m.getLatLng();
        if (at.lat !== s.lat || at.lng !== s.lng) had.m.setLatLng([s.lat, s.lng]);
        if (had.z !== s.z) {
          had.m.setZIndexOffset((s.z ?? 0) * 1000);
          had.z = s.z;
        }
        had.click = s.onClick;
        continue;
      }
      had?.m.remove();
      const icon = L.divIcon({ html: host(s.id), className: 'ns-pin', iconSize: [s.size, s.size], iconAnchor: [s.size / 2, s.size / 2] });
      const m = L.marker([s.lat, s.lng], {
        icon,
        interactive: !!s.onClick,
        keyboard: !!s.onClick,
        title: '',
        alt: s.label ?? '',
        zIndexOffset: (s.z ?? 0) * 1000,
        riseOnHover: false,
      });
      const entry = { m, size: s.size, label: s.label, z: s.z, click: s.onClick };
      m.on('click', (e: Leaflet.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        entry.click?.();
      });
      m.on('add', () => {
        const el = m.getElement();
        if (!el) return;
        if (s.onClick) {
          el.setAttribute('role', 'button');
          if (s.label) el.setAttribute('aria-label', s.label);
        } else el.setAttribute('aria-hidden', 'true');
      });
      m.addTo(map);
      markers.current.set(s.id, entry);
    }
    for (const [id, e] of markers.current) {
      if (!live.has(id)) {
        e.m.remove();
        markers.current.delete(id);
        hosts.current.delete(id);
      }
    }
  });

  return {
    portals: specs.map((s) => createPortal(s.face, host(s.id), s.id)),
  };
}
