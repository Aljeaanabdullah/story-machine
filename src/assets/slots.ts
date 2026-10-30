import type { ArchetypeId, WorldId } from '@/data/catalog';

/** Artwork slots filled from assets/art/<slot>.(webp|jpg|png). See assets/art/README.md. */
export type ArtSlot = 'home-hero' | `world-${WorldId}` | `hero-${ArchetypeId}`;
