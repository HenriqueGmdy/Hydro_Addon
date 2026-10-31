// Gera os arquivos repetitivos do Hydro Addon a partir de tools/dados.mjs.
// Uso: npm run gerar (ou node tools/gerar.mjs)
// As pastas geradas são apagadas e recriadas a cada execução; não edite arquivos dentro delas à mão.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CONJUNTOS, DURABILIDADE_BASE, ESTAGIOS, MATERIAIS, PECAS, TEXTOS } from "./dados.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const BP = join(RAIZ, "Hydro_BP");
const RP = join(RAIZ, "Hydro_RP");
const FORMATO_ITEM = "1.21.60";
const GERADAS = [
  join(BP, "items/armaduras"),
  join(BP, "items/materiais"),
  join(BP, "recipes/armaduras"),
  join(RP, "attachables/armaduras"),
];

const porId = new Map(CONJUNTOS.map((c) => [c.id, c]));
const pecasDe = (c) => c.pecas ?? [0, 1, 2, 3];
const nome = (id) => id.split(":")[1];

function escrever(caminho, dados) {
  mkdirSync(dirname(caminho), { recursive: true });
  writeFileSync(caminho, typeof dados === "string" ? dados : JSON.stringify(dados, null, 2) + "\n");
}

// Identificador do item de uma peça. O estágio 0 de conjuntos vanilla é o item do Minecraft.
function idDaPeca(c, peca, estagio = 0, carregado = false) {
  const chave = PECAS[peca].chave;
  if (c.vanilla || (c.vanillaNoEstagio0 && estagio === 0 && !carregado)) return `minecraft:${c.id}_${chave}`;
  return `hydro:${c.id}_${chave}${ESTAGIOS[estagio].sufixo}${carregado ? "_charged" : ""}`;
}

function nomeDaPeca(c, peca, estagio, lingua) {
  const p = PECAS[peca];
  if (lingua === "pt") {
    const base = c.nomesPt?.[pecasDe(c).indexOf(peca)] ?? `${p.pt} ${c.pt}`;
    return base + ESTAGIOS[estagio].pt[p.genero];
  }
  const base = c.nomesEn?.[pecasDe(c).indexOf(peca)] ?? `${c.en} ${p.en}`;
  return ESTAGIOS[estagio].en + base;
}

// Todas as variantes de item de um conjunto (estágios de oxidação e versões carregadas).
function variantes(c) {
  const lista = [];
  const estagios = c.estagios ? [0, 1, 2, 3] : [0];
  for (const peca of pecasDe(c))
    for (const estagio of estagios)
      for (const carregado of c.carregado ? [false, true] : [false]) lista.push({ peca, estagio, carregado, id: idDaPeca(c, peca, estagio, carregado) });
  return lista;
}

const iconeDe = (c, peca, estagio) => `hydro_${c.id}_${PECAS[peca].chave}${ESTAGIOS[estagio].sufixo}`;
const texturaIcone = (c, peca, estagio) => `textures/items/armaduras/${c.id}/${c.id}_${PECAS[peca].chave}${ESTAGIOS[estagio].sufixo}`;
const texturaModelo = (c, peca, estagio) => `textures/models/armor/${c.id}${ESTAGIOS[estagio].sufixo}_${PECAS[peca].camada}`;

for (const pasta of GERADAS) rmSync(pasta, { recursive: true, force: true });

const texturasItens = {};
const lang = { pt: [], en: [] };
const dadosScript = {};

for (const c of CONJUNTOS) {
  for (const v of variantes(c)) {
    const p = PECAS[v.peca];
    dadosScript[v.id] = {
      conjunto: c.id, peca: v.peca, estagio: v.estagio, carregado: v.carregado,
      tier: c.tier, classe: c.classe, pontos: c.pontos[v.peca],
    };
    if (v.id.startsWith("minecraft:")) continue;

    const durabilidade = c.durabilidade?.[v.peca] ?? c.fator * DURABILIDADE_BASE[v.peca];
    const reparo = c.reparo ?? c.material;
    const nomeItem = nome(v.id);
    const oculto = v.estagio > 0 || v.carregado;
    const componentes = {
      "minecraft:max_stack_size": 1,
      "minecraft:icon": iconeDe(c, v.peca, v.estagio),
      "minecraft:display_name": { value: `item.hydro.${nome(idDaPeca(c, v.peca, v.estagio, false))}` },
      "minecraft:wearable": { slot: p.slot, protection: c.pontos[v.peca] },
      "minecraft:durability": { max_durability: durabilidade },
      "minecraft:enchantable": { slot: p.encantavel, value: 12 },
      "minecraft:repairable": { repair_items: [{ items: [reparo], repair_amount: Math.ceil(durabilidade / 4) }] },
      "minecraft:tags": { tags: ["minecraft:is_armor", `hydro:${c.id}`] },
    };
    if (v.carregado) componentes["minecraft:glint"] = true;
    escrever(join(BP, "items/armaduras", c.id, `${nomeItem}.json`), {
      format_version: FORMATO_ITEM,
      "minecraft:item": {
        description: {
          identifier: v.id,
          menu_category: oculto ? { category: "none" } : { category: "equipment", group: `minecraft:itemGroup.name.${p.chave === "chestplate" ? "chestplate" : p.chave}` },
        },
        components: componentes,
      },
    });

    escrever(join(RP, "attachables/armaduras", c.id, `${nomeItem}.json`), {
      format_version: "1.10.0",
      "minecraft:attachable": {
        description: {
          identifier: v.id,
          materials: { default: "armor", enchanted: "armor_enchanted" },
          textures: { default: texturaModelo(c, v.peca, v.estagio), enchanted: "textures/misc/enchanted_item_glint" },
          geometry: { default: `geometry.humanoid.armor.${p.chave === "chestplate" ? "chestplate" : p.chave}` },
          scripts: { parent_setup: `variable.${p.visivel}_layer_visible = 0.0;` },
          render_controllers: [v.carregado ? "controller.render.hydro_armadura_brilhando" : "controller.render.armor"],
        },
      },
    });

    if (!v.carregado) {
      texturasItens[iconeDe(c, v.peca, v.estagio)] = { textures: texturaIcone(c, v.peca, v.estagio) };
      lang.pt.push(`item.hydro.${nomeItem}=${nomeDaPeca(c, v.peca, v.estagio, "pt")}`);
      lang.en.push(`item.hydro.${nomeItem}=${nomeDaPeca(c, v.peca, v.estagio, "en")}`);
    }
  }

  // Receitas de upgrade: peça anterior no meio, material em volta.
  if (c.base && (!c.vanilla || c.sobrescreveReceita)) {
    const base = porId.get(c.base);
    for (const peca of pecasDe(c)) {
      const resultado = idDaPeca(c, peca);
      const chave = { X: { item: c.material }, A: { item: idDaPeca(base, peca) } };
      for (const [letra, item] of Object.entries(c.extra ?? {})) chave[letra] = { item };
      escrever(join(BP, "recipes/armaduras", c.id, `${nome(resultado)}.json`), {
        format_version: FORMATO_ITEM,
        "minecraft:recipe_shaped": {
          description: { identifier: resultado },
          tags: ["crafting_table"],
          pattern: c.forma?.[pecasDe(c).indexOf(peca)] ?? PECAS[peca].forma,
          key: chave,
          unlock: [{ item: c.material }],
          result: { item: resultado, count: 1 },
        },
      });
    }
  }
}

for (const m of MATERIAIS) {
  escrever(join(BP, "items/materiais", `${m.id}.json`), {
    format_version: FORMATO_ITEM,
    "minecraft:item": {
      description: { identifier: `hydro:${m.id}`, menu_category: { category: "items" } },
      components: {
        "minecraft:max_stack_size": 64,
        "minecraft:icon": `hydro_${m.id}`,
        "minecraft:display_name": { value: `item.hydro.${m.id}` },
      },
    },
  });
  texturasItens[`hydro_${m.id}`] = { textures: `textures/items/materiais/${m.id}` };
  lang.pt.push(`item.hydro.${m.id}=${m.pt}`);
  lang.en.push(`item.hydro.${m.id}=${m.en}`);
}

for (const t of TEXTOS) {
  lang.pt.push(`${t.chave}=${t.pt}`);
  lang.en.push(`${t.chave}=${t.en}`);
}

const aviso = "## Gerado por tools/gerar.mjs a partir de tools/dados.mjs. Não edite à mão.";
escrever(join(RP, "texts/pt_BR.lang"), [aviso, ...lang.pt, ""].join("\n"));
escrever(join(RP, "texts/en_US.lang"), [aviso, ...lang.en, ""].join("\n"));
escrever(join(RP, "textures/item_texture.json"), { resource_pack_name: "hydro", texture_name: "atlas.items", texture_data: texturasItens });

const conjuntosScript = Object.fromEntries(
  CONJUNTOS.map((c) => [c.id, { tier: c.tier, classe: c.classe, estagios: !!c.estagios, carregado: !!c.carregado, pecas: pecasDe(c), familia: c.conjunto ?? c.id }])
);
escrever(
  join(BP, "scripts/dados/armaduras.js"),
  `// Gerado por tools/gerar.mjs a partir de tools/dados.mjs. Não edite à mão.\n` +
    `export const ARMADURAS = ${JSON.stringify(dadosScript, null, 2)};\n\n` +
    `export const CONJUNTOS = ${JSON.stringify(conjuntosScript, null, 2)};\n\n` +
    `export const SUFIXOS_ESTAGIO = ${JSON.stringify(ESTAGIOS.map((e) => e.sufixo))};\n` +
    `export const PECAS = ${JSON.stringify(PECAS.map((p) => p.chave))};\n` +
    `const VANILLA_NO_ESTAGIO_0 = ${JSON.stringify(CONJUNTOS.filter((c) => c.vanilla || c.vanillaNoEstagio0).map((c) => c.id))};\n\n` +
    `// Identificador do item de uma peça (mesma regra do gerador).\n` +
    `export function idDaPeca(conjunto, peca, estagio = 0, carregado = false) {\n` +
    `  const chave = PECAS[peca];\n` +
    `  if (VANILLA_NO_ESTAGIO_0.includes(conjunto) && estagio === 0 && !carregado) return \`minecraft:\${conjunto}_\${chave}\`;\n` +
    `  return \`hydro:\${conjunto}_\${chave}\${SUFIXOS_ESTAGIO[estagio]}\${carregado ? "_charged" : ""}\`;\n` +
    `}\n`
);

console.log(`Pronto: ${Object.keys(dadosScript).length} armaduras, ${MATERIAIS.length} materiais.`);
