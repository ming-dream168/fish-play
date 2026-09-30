// 物种注册表. 变体 (婚姻色, 膨胀, 性逆转) 与正常形态同拓扑, 可直接插值.
import type { SpeciesId } from '../../data/types';
import type { SpeciesSpec } from '../spec';
import { whaleshark } from './whaleshark';
import { sturgeon } from './sturgeon';
import { carp } from './carp';
import { chum, chumSpawn } from './chum';
import { ricefield, ricefieldMale } from './ricefield';
import { bluefin } from './bluefin';
import { hairtail } from './hairtail';
import { largeyellow } from './croaker';
import { goosefish } from './goosefish';
import { puffer, pufferInflated } from './puffer';

type Maker = () => SpeciesSpec;

const makers: Partial<Record<SpeciesId, Maker>> = { whaleshark, sturgeon, carp, chum, ricefield, bluefin, hairtail, largeyellow, goosefish, puffer };
const variants: Record<string, Maker> = {
  'chum-spawn': chumSpawn,
  'ricefield-male': ricefieldMale,
  'puffer-inflated': pufferInflated,
};

const cache = new Map<string, SpeciesSpec>();

export function registerSpecies(id: SpeciesId, m: Maker) {
  makers[id] = m;
}
export function registerVariant(key: string, m: Maker) {
  variants[key] = m;
}

export function getSpecies(id: SpeciesId | string): SpeciesSpec {
  const hit = cache.get(id);
  if (hit) return hit;
  const m = (makers as Record<string, Maker | undefined>)[id] ?? variants[id];
  if (!m) throw new Error('unknown species ' + id);
  const s = m();
  cache.set(id, s);
  return s;
}

export function hasSpecies(id: string) {
  return !!((makers as Record<string, Maker | undefined>)[id] ?? variants[id]);
}
