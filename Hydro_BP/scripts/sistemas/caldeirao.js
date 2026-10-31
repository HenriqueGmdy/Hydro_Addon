// Caldeirão do Hydro (hydro:caldeirao): água, poções, flechas, slime, magma, mel e garimpo de estanho.
// Estados: hydro:conteudo (vazio, agua, pocao, slime, magma, mel) e hydro:nivel (0 a 6).
// Uma garrafa vale 2 níveis; um balde enche os 6.
import { BlockPermutation, GameMode, ItemStack, system, world } from "@minecraft/server";
import { BLOCOS_NO_CALDEIRAO, CHANCE_ESTANHO, GARIMPOS_POR_NIVEL } from "../config.js";
import { naMao } from "../util/equipamento.js";

const ID = "hydro:caldeirao";
const CHEIO = 6;
const GARRAFA = 2;

// Número de cada poção no Bedrock (usado no /give e nas flechas: flecha com poção = número + 1).
const NUMERO_DA_POCAO = {
  water: 0, mundane: 1, long_mundane: 2, thick: 3, awkward: 4, nightvision: 5, long_nightvision: 6, invisibility: 7,
  long_invisibility: 8, leaping: 9, long_leaping: 10, strong_leaping: 11, fire_resistance: 12, long_fire_resistance: 13,
  swiftness: 14, long_swiftness: 15, strong_swiftness: 16, slowness: 17, long_slowness: 18, water_breathing: 19,
  long_water_breathing: 20, healing: 21, strong_healing: 22, harming: 23, strong_harming: 24, poison: 25, long_poison: 26,
  strong_poison: 27, regeneration: 28, long_regeneration: 29, strong_regeneration: 30, strength: 31, long_strength: 32,
  strong_strength: 33, weakness: 34, long_weakness: 35, wither: 36, turtle_master: 37, long_turtle_master: 38,
  strong_turtle_master: 39, slow_falling: 40, long_slow_falling: 41, strong_slowness: 42, wind_charged: 43, weaving: 44,
  oozing: 45, infested: 46,
};

// Efeito ao entrar no caldeirão: [efeito, ticks, amplificador].
const EFEITOS_DA_POCAO = {
  nightvision: [["night_vision", 3600]], long_nightvision: [["night_vision", 9600]],
  invisibility: [["invisibility", 3600]], long_invisibility: [["invisibility", 9600]],
  leaping: [["jump_boost", 3600]], long_leaping: [["jump_boost", 9600]], strong_leaping: [["jump_boost", 1800, 1]],
  fire_resistance: [["fire_resistance", 3600]], long_fire_resistance: [["fire_resistance", 9600]],
  swiftness: [["speed", 3600]], long_swiftness: [["speed", 9600]], strong_swiftness: [["speed", 1800, 1]],
  slowness: [["slowness", 1800]], long_slowness: [["slowness", 4800]], strong_slowness: [["slowness", 400, 3]],
  water_breathing: [["water_breathing", 3600]], long_water_breathing: [["water_breathing", 9600]],
  healing: [["instant_health", 1]], strong_healing: [["instant_health", 1, 1]],
  harming: [["instant_damage", 1]], strong_harming: [["instant_damage", 1, 1]],
  poison: [["poison", 900]], long_poison: [["poison", 2400]], strong_poison: [["poison", 432, 1]],
  regeneration: [["regeneration", 900]], long_regeneration: [["regeneration", 2400]], strong_regeneration: [["regeneration", 450, 1]],
  strength: [["strength", 3600]], long_strength: [["strength", 9600]], strong_strength: [["strength", 1800, 1]],
  weakness: [["weakness", 1800]], long_weakness: [["weakness", 4800]],
  wither: [["wither", 800, 1]],
  turtle_master: [["slowness", 400, 3], ["resistance", 400, 2]], long_turtle_master: [["slowness", 800, 3], ["resistance", 800, 2]],
  strong_turtle_master: [["slowness", 400, 5], ["resistance", 400, 3]],
  slow_falling: [["slow_falling", 1800]], long_slow_falling: [["slow_falling", 4800]],
  wind_charged: [["wind_charged", 3600]], weaving: [["weaving", 3600]], oozing: [["oozing", 3600]], infested: [["infested", 3600]],
};

const nomeDaPocao = (item) => item?.getComponent("minecraft:potion")?.potionEffectType.id.replace("minecraft:", "");
const chave = (block) => `hydro:caldeirao:${block.dimension.id}:${block.location.x},${block.location.y},${block.location.z}`;
const estado = (block) => ({
  conteudo: String(block.permutation.getState("hydro:conteudo")),
  nivel: Number(block.permutation.getState("hydro:nivel")),
});

function definir(block, conteudo, nivel) {
  if (nivel <= 0) {
    conteudo = "vazio";
    nivel = 0;
    world.setDynamicProperty(`${chave(block)}:pocao`, undefined);
  }
  block.setPermutation(block.permutation.withState("hydro:conteudo", conteudo).withState("hydro:nivel", Math.min(CHEIO, nivel)));
}

const sobre = (block) => ({ x: block.location.x + 0.5, y: block.location.y + 1, z: block.location.z + 0.5 });

function som(block, id) {
  try {
    block.dimension.playSound(id, sobre(block), { volume: 0.6 });
  } catch {}
}

function dar(player, item) {
  const sobra = player.getComponent("minecraft:inventory")?.container?.addItem(item);
  if (sobra) player.dimension.spawnItem(sobra, player.location);
}

// Gasta um item da mão (no criativo não gasta) e, se pedido, devolve outro no lugar.
function gastarDaMao(player, devolve) {
  if (player.getGameMode() === GameMode.Creative) return;
  const inv = player.getComponent("minecraft:inventory")?.container;
  const item = inv?.getItem(player.selectedSlotIndex);
  if (!item) return;
  if (item.amount > 1) {
    item.amount -= 1;
    inv.setItem(player.selectedSlotIndex, item);
    if (devolve) dar(player, new ItemStack(devolve, 1));
  } else inv.setItem(player.selectedSlotIndex, devolve ? new ItemStack(devolve, 1) : undefined);
}

function garimpar(player, block, nivel) {
  gastarDaMao(player);
  const usos = Number(world.getDynamicProperty(chave(block)) ?? 0) + 1;
  if (usos >= GARIMPOS_POR_NIVEL) {
    world.setDynamicProperty(chave(block), undefined);
    definir(block, "agua", nivel - GARRAFA);
  } else world.setDynamicProperty(chave(block), usos);
  som(block, "random.splash");
  try {
    block.dimension.spawnParticle("minecraft:water_splash_particle", sobre(block));
  } catch {}
  if (Math.random() < CHANCE_ESTANHO) {
    block.dimension.spawnItem(new ItemStack("hydro:tin_nugget", 1), sobre(block));
    som(block, "random.orb");
  }
}

function interagir(player, block) {
  const item = naMao(player);
  const tipo = item?.typeId;
  const { conteudo, nivel } = estado(block);
  const pocaoGuardada = world.getDynamicProperty(`${chave(block)}:pocao`);

  if (tipo === "minecraft:granite") {
    if (conteudo === "agua" && nivel > 0) garimpar(player, block, nivel);
    else player.onScreenDisplay.setActionBar("§7O caldeirão precisa de água para garimpar.");
    return;
  }
  if (tipo === "minecraft:water_bucket" && (conteudo === "vazio" || conteudo === "agua")) {
    gastarDaMao(player, "minecraft:bucket");
    definir(block, "agua", CHEIO);
    return som(block, "bucket.empty_water");
  }
  if (tipo === "minecraft:bucket" && conteudo === "agua" && nivel === CHEIO) {
    gastarDaMao(player, "minecraft:water_bucket");
    definir(block, "vazio", 0);
    return som(block, "bucket.fill_water");
  }
  if (tipo === "minecraft:potion") {
    const pocao = nomeDaPocao(item);
    if (!pocao || nivel > CHEIO - GARRAFA) return;
    if (pocao === "water" && (conteudo === "vazio" || conteudo === "agua")) {
      gastarDaMao(player, "minecraft:glass_bottle");
      definir(block, "agua", nivel + GARRAFA);
      return som(block, "random.splash");
    }
    if (pocao !== "water" && (conteudo === "vazio" || (conteudo === "pocao" && pocaoGuardada === pocao))) {
      gastarDaMao(player, "minecraft:glass_bottle");
      definir(block, "pocao", nivel + GARRAFA);
      world.setDynamicProperty(`${chave(block)}:pocao`, pocao);
      return som(block, "random.splash");
    }
    return;
  }
  if (tipo === "minecraft:glass_bottle" && nivel >= GARRAFA && (conteudo === "agua" || conteudo === "pocao")) {
    const numero = conteudo === "agua" ? 0 : NUMERO_DA_POCAO[pocaoGuardada] ?? 0;
    gastarDaMao(player);
    player.runCommand(`give @s potion 1 ${numero}`);
    definir(block, conteudo, nivel - GARRAFA);
    return som(block, "random.splash");
  }
  // Um slot inteiro de flechas (até um pack) vira flechas com a poção e gasta 2 níveis.
  if (tipo === "minecraft:arrow" && conteudo === "pocao" && nivel >= GARRAFA && pocaoGuardada) {
    if (item.getComponent("minecraft:potion")) return; // já tem poção
    const numero = NUMERO_DA_POCAO[pocaoGuardada];
    if (numero === undefined) return;
    player.runCommand(`replaceitem entity @s slot.weapon.mainhand 0 arrow ${item.amount} ${numero + 1}`);
    definir(block, "pocao", nivel - GARRAFA);
    return som(block, "random.splash");
  }
  const receita = BLOCOS_NO_CALDEIRAO[tipo];
  if (receita && (conteudo === "vazio" || conteudo === receita.conteudo) && nivel < CHEIO) {
    gastarDaMao(player, receita.devolve);
    definir(block, receita.conteudo, nivel + receita.porItem);
    return som(block, "random.pop");
  }
  // Caldeirão cheio de slime, magma ou mel: com a mão vazia, tira o bloco pronto.
  if (!item && nivel === CHEIO) {
    const pronto = Object.values(BLOCOS_NO_CALDEIRAO).find((r) => r.conteudo === conteudo);
    if (!pronto) return;
    dar(player, new ItemStack(pronto.bloco, 1));
    definir(block, "vazio", 0);
    som(block, "random.pop");
  }
}

// Pisar num caldeirão com poção dá o efeito dela e gasta tudo.
function pisar(entidade, block) {
  if (entidade?.typeId !== "minecraft:player") return;
  const { conteudo } = estado(block);
  if (conteudo !== "pocao") return;
  const pocao = world.getDynamicProperty(`${chave(block)}:pocao`);
  for (const [efeito, ticks, amplificador = 0] of EFEITOS_DA_POCAO[pocao] ?? []) entidade.addEffect(efeito, ticks, { amplifier: amplificador });
  definir(block, "vazio", 0);
  som(block, "random.splash");
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent(ID, {
    onPlayerInteract: (ev) => ev.player && interagir(ev.player, ev.block),
    onStepOn: (ev) => pisar(ev.entity, ev.block),
    onPlayerBreak: (ev) => {
      world.setDynamicProperty(chave(ev.block), undefined);
      world.setDynamicProperty(`${chave(ev.block)}:pocao`, undefined);
    },
  });
});

// Caldeirões vanilla (de antes do addon ou de estruturas) viram o do Hydro no primeiro clique.
world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
  if (!ev.isFirstEvent || ev.block.typeId !== "minecraft:cauldron") return;
  const liquido = ev.block.permutation.getState("cauldron_liquid");
  if (liquido !== undefined && liquido !== "water") return;
  ev.cancel = true;
  const { block } = ev;
  const nivel = block.permutation.getState("fill_level") ?? 0;
  system.run(() => {
    if (!block.isValid || block.typeId !== "minecraft:cauldron") return;
    block.setPermutation(BlockPermutation.resolve(ID, { "hydro:conteudo": nivel > 0 ? "agua" : "vazio", "hydro:nivel": nivel }));
  });
});
