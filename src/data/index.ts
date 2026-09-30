// 汇总图鉴资料. 每个物种一份资料文件 (species/<id>.ts, 导出 INFO 与 NOTES), 旧版的集中资料表
// species-info.ts 作为后备; 结构说明来自 structure-info.ts, 物种特例从各物种文件的 NOTES 合并进来.
// 资料文件缺失时回退到结构名兜底表.
import type { SpeciesId, SpeciesInfo, StructureId, StructureInfo } from './types';
import { FALLBACK_NAMES, SYSTEM_ZH } from './fallback';

type SpeciesModule = { INFO?: SpeciesInfo; NOTES?: Partial<Record<StructureId, string>> };

const spMods = import.meta.glob('./species-info.ts', { eager: true }) as Record<string, { SPECIES_INFO?: Partial<Record<SpeciesId, SpeciesInfo>> }>;
const stMods = import.meta.glob('./structure-info.ts', { eager: true }) as Record<string, { STRUCTURE_INFO?: Partial<Record<StructureId, StructureInfo>> }>;
const perSpecies = import.meta.glob('./species/*.ts', { eager: true }) as Record<string, SpeciesModule>;

const SP = Object.values(spMods)[0]?.SPECIES_INFO;
const ST = Object.values(stMods)[0]?.STRUCTURE_INFO;

const PER = new Map<SpeciesId, SpeciesModule>();
for (const m of Object.values(perSpecies)) if (m.INFO) PER.set(m.INFO.id, m);

export function speciesInfo(id: SpeciesId): SpeciesInfo | undefined {
  return PER.get(id)?.INFO ?? SP?.[id];
}

export function structureInfo(id: StructureId): StructureInfo {
  const base = ST?.[id];
  const [zh, en, system] = FALLBACK_NAMES[id];
  const s: StructureInfo = base ? { ...base } : { id, zh, en, system, body: '' };
  // 物种文件里的特例覆盖旧表
  const notes: Partial<Record<SpeciesId, string>> = { ...(base?.speciesNotes ?? {}) };
  for (const [sid, m] of PER) {
    const n = m.NOTES?.[id];
    if (n) notes[sid] = n;
  }
  s.speciesNotes = notes;
  return s;
}

export { SYSTEM_ZH };
