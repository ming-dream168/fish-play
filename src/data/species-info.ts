// 旧版集中资料表 (后备). 现在每个物种都有自己的资料文件 species/<id>.ts, 这里不再收录任何物种;
// 旧的大西洋蓝鳍金枪鱼 (Thunnus thynnus) 条目已随换成太平洋蓝鳍删除. 新物种若暂时没有资料文件, 可以先在这里补一条.
import type { SpeciesId, SpeciesInfo } from './types';

export const SPECIES_INFO: Partial<Record<SpeciesId, SpeciesInfo>> = {};
