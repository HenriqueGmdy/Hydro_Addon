// Fonte única das armaduras, materiais e nomes do Hydro Addon.
// Depois de mudar algo aqui, rode `npm run gerar` para recriar os JSON de itens,
// attachables, receitas de armadura, traduções, item_texture.json e scripts/dados/armaduras.js.

export const PECAS = [
  { chave: "helmet", slot: "slot.armor.head", encantavel: "armor_head", camada: 1, visivel: "helmet", forma: ["XAX", "X X"], pt: "Capacete", en: "Helmet", genero: "m" },
  { chave: "chestplate", slot: "slot.armor.chest", encantavel: "armor_torso", camada: 1, visivel: "chest", forma: ["X X", "XAX", "XXX"], pt: "Peitoral", en: "Chestplate", genero: "m" },
  { chave: "leggings", slot: "slot.armor.legs", encantavel: "armor_legs", camada: 2, visivel: "leg", forma: ["XAX", "X X", "X X"], pt: "Calça", en: "Leggings", genero: "f" },
  { chave: "boots", slot: "slot.armor.feet", encantavel: "armor_feet", camada: 1, visivel: "boot", forma: ["XAX", "X X"], pt: "Botas", en: "Boots", genero: "fp" },
];

// Durabilidade vanilla = fator × base da peça.
export const DURABILIDADE_BASE = [11, 16, 15, 13];

// Estágios de oxidação. O adjetivo muda com o gênero da peça.
export const ESTAGIOS = [
  { sufixo: "", pt: { m: "", f: "", fp: "" }, en: "" },
  { sufixo: "_exposed", pt: { m: " Exposto", f: " Exposta", fp: " Expostas" }, en: "Exposed " },
  { sufixo: "_weathered", pt: { m: " Desgastado", f: " Desgastada", fp: " Desgastadas" }, en: "Weathered " },
  { sufixo: "_oxidized", pt: { m: " Oxidado", f: " Oxidada", fp: " Oxidadas" }, en: "Oxidized " },
];

// Classes e tiers usados pela fórmula de defesa (ver scripts/config.js).
// vanilla: true = item do Minecraft (não gera item nem attachable).
// base: armadura usada no centro da receita de upgrade; material: item em volta.
// estagios: oxida (cria um item por estágio). carregado: tem versão com brilho para o para-raios.
export const CONJUNTOS = [
  { id: "leather", vanilla: true, tier: 2, classe: "default", pontos: [1, 3, 2, 1] },
  {
    id: "studded_leather", tier: 2, classe: "melee", pontos: [1, 3, 3, 1], fator: 9,
    base: "leather", material: "hydro:treated_leather", pt: "de Couro Batido", en: "Studded Leather",
  },
  {
    id: "fur", tier: 2, classe: "mago", pontos: [1, 2, 2, 1], fator: 6,
    base: "leather", material: "minecraft:rabbit_hide", pt: "de Pele", en: "Fur",
    nomesPt: ["Gorro de Pele", "Gibão de Pele", "Calça de Pele", "Botas de Pele"],
    nomesEn: ["Fur Cap", "Fur Doublet", "Fur Trousers", "Fur Boots"],
  },
  {
    id: "copper", tier: 3, classe: "default", pontos: [2, 4, 3, 1], fator: 11, vanillaNoEstagio0: true,
    base: "leather", material: "minecraft:copper_ingot", reparo: "minecraft:copper_ingot",
    pt: "de Cobre", en: "Copper", estagios: true, carregado: true, sobrescreveReceita: true,
  },
  {
    id: "copper_plate", tier: 3, classe: "melee", pontos: [2, 5, 4, 2], durabilidade: [150, 220, 205, 180],
    base: "copper", material: "hydro:copper_plate", reparo: "hydro:copper_plate",
    pt: "de Placas de Cobre", en: "Copper Plate", estagios: true,
  },
  { id: "turtle", vanilla: true, tier: 3, classe: "default", pontos: [2, 0, 0, 0], pecas: [0] },
  {
    id: "chainmail", vanilla: true, tier: 4, classe: "default", pontos: [2, 5, 4, 1],
    base: "leather", material: "minecraft:iron_nugget", sobrescreveReceita: true,
  },
  {
    id: "bronze", tier: 4, classe: "default", alternativa: true, pontos: [2, 5, 4, 2], fator: 17,
    base: "chainmail", material: "hydro:bronze_ingot", pt: "de Bronze", en: "Bronze", carregado: true,
  },
  {
    id: "iron", vanilla: true, tier: 5, classe: "default", pontos: [2, 6, 5, 2],
    base: "chainmail", material: "minecraft:iron_ingot", sobrescreveReceita: true,
  },
  {
    id: "iron_ranger", tier: 5, classe: "ranged", pontos: [2, 0, 0, 0], fator: 15, pecas: [0], conjunto: "iron",
    base: "chainmail", material: "minecraft:iron_ingot", extra: { F: "minecraft:feather" }, forma: [["XAX", "XFX"]],
    reparo: "minecraft:iron_ingot", pt: "Ranger de Ferro", en: "Iron Ranger",
    nomesPt: ["Capacete Ranger de Ferro"], nomesEn: ["Iron Ranger Helmet"],
  },
  {
    id: "iron_plate", tier: 5, classe: "melee", pontos: [3, 7, 6, 3], fator: 22,
    base: "iron", material: "hydro:iron_plate", pt: "de Placas de Ferro", en: "Iron Plate",
  },
  {
    id: "nickel", tier: 5, classe: "default", alternativa: true, pontos: [2, 6, 5, 2], fator: 19,
    base: "bronze", material: "hydro:nickel_ingot", pt: "de Níquel", en: "Nickel",
  },
  {
    id: "golden", vanilla: true, tier: 6, classe: "default", pontos: [2, 5, 3, 1],
    base: "iron", material: "minecraft:gold_ingot", sobrescreveReceita: true,
  },
  {
    id: "golden_ranger", tier: 6, classe: "ranged", pontos: [2, 0, 0, 0], fator: 15, pecas: [0], conjunto: "golden",
    base: "iron_ranger", material: "minecraft:gold_ingot", reparo: "minecraft:gold_ingot",
    pt: "Ranger de Ouro", en: "Golden Ranger", nomesPt: ["Capacete Ranger de Ouro"], nomesEn: ["Golden Ranger Helmet"],
  },
  {
    id: "magmarine", tier: 6, classe: "default", pontos: [3, 7, 5, 3], fator: 26,
    base: "nickel", material: "minecraft:quartz", reparo: "hydro:nickel_ingot", pt: "de Magmarina", en: "Magmarine",
  },
  { id: "diamond", vanilla: true, tier: 6, classe: "melee", pontos: [3, 8, 6, 3] },
  { id: "netherite", vanilla: true, tier: 7, classe: "melee", pontos: [3, 8, 6, 3] },
];

// Materiais e itens simples.
export const MATERIAIS = [
  { id: "tin_nugget", pt: "Pepita de Estanho", en: "Tin Nugget" },
  { id: "tin_ingot", pt: "Lingote de Estanho", en: "Tin Ingot" },
  { id: "copper_plate", pt: "Chapa de Cobre", en: "Copper Plate" },
  { id: "raw_iron_nugget", pt: "Pepita de Ferro Cru", en: "Raw Iron Nugget" },
  { id: "raw_gold_nugget", pt: "Pepita de Ouro Cru", en: "Raw Gold Nugget" },
  { id: "raw_diamond_nugget", pt: "Pepita de Diamante Bruto", en: "Raw Diamond Nugget" },
  { id: "diamond_nugget", pt: "Pepita de Diamante", en: "Diamond Nugget" },
  { id: "treated_leather", pt: "Couro Tratado", en: "Treated Leather" },
  { id: "bronze_ingot", pt: "Lingote de Bronze", en: "Bronze Ingot" },
  { id: "iron_plate", pt: "Chapa de Ferro", en: "Iron Plate" },
  { id: "nickel_ingot", pt: "Lingote de Níquel", en: "Nickel Ingot" },
];

// Nomes de blocos e textos soltos (o resto das traduções é gerado).
export const TEXTOS = [
  { chave: "tile.hydro:caldeirao.name", pt: "Caldeirão", en: "Cauldron" },
  { chave: "tile.hydro:fornalha_infernal.name", pt: "Fornalha Infernal", en: "Infernal Furnace" },
  { chave: "hydro.fornalha_infernal", pt: "Fornalha Infernal", en: "Infernal Furnace" },
];
