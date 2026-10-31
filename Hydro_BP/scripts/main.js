// Hydro Addon: protótipo do tier de cobre.
// Para-raios (armadura de cobre), raio no golpe (placas de cobre), oxidação,
// fórmula de defesa do Hydro e garimpo de estanho no caldeirão.
import { world, system, EquipmentSlot, GameMode, ItemStack } from "@minecraft/server";

const SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
const PIECES = ["helmet", "chestplate", "leggings", "boots"];
const STAGE_SUFFIX = ["", "_exposed", "_weathered", "_oxidized"];

// ---------- Ajustes de balanceamento ----------
const DEFENSE_PER_POINT = 0.025; // cada ponto de armadura reduz 2,5% (vanilla: 4%)
const DEFENSE_CAP = 0.5; // redução máxima de 50% (vanilla: 80%)
const OXIDATION_MULT = [1, 0.85, 0.7, 0.5]; // defesa Hydro por estágio de oxidação
const OXIDATION_MINUTES = 20; // minutos vestida para subir um estágio (dobra na chuva ou na água)
// Chances acumulativas: começam na base, sobem a cada tentativa que falha, até o máximo; voltam à base quando o raio cai.
const ROD_CHECK_SECONDS = 10; // a cada quantos segundos o para-raios tenta atrair um raio
const ROD_CHANCE = { base: 0.05, step: 0.05, max: 0.25 };
const PLATE_CHANCE = { base: 0.05, step: 0.05, max: 0.25 }; // por golpe
const ROD_CHARGE_TICKS = 60; // tempo soltando faíscas antes do raio
const ROD_COOLDOWN_TICKS = 1200;
const ROD_BUFF_TICKS = 300; // 15 s
const ROD_DAMAGE_KEPT = 0.5; // fração do dano do raio que o jogador realmente toma
const TIN_CHANCE = 0.6;
const USES_PER_WATER_LEVEL = 3;

// Conjuntos que oxidam. O estágio 0 da armadura de cobre é o item vanilla; os outros são itens do Hydro.
const OXIDIZING_SETS = {
  copper: { points: [2, 4, 3, 1], id: (piece, stage) => (stage === 0 ? `minecraft:copper_${piece}` : `hydro:copper_${piece}${STAGE_SUFFIX[stage]}`) },
  plate: { points: [2, 5, 4, 2], id: (piece, stage) => `hydro:copper_plate_${piece}${STAGE_SUFFIX[stage]}` },
};
const OXIDIZING = new Map(); // typeId -> { set, piece, stage }
for (const [set, def] of Object.entries(OXIDIZING_SETS)) {
  PIECES.forEach((piece, i) => STAGE_SUFFIX.forEach((_, stage) => OXIDIZING.set(def.id(piece, stage), { set, piece: i, stage })));
}

// Pontos de armadura que o vanilla usa no cálculo dele.
const ARMOR_POINTS = {
  "minecraft:leather_helmet": 1, "minecraft:leather_chestplate": 3, "minecraft:leather_leggings": 2, "minecraft:leather_boots": 1,
  "minecraft:chainmail_helmet": 2, "minecraft:chainmail_chestplate": 5, "minecraft:chainmail_leggings": 4, "minecraft:chainmail_boots": 1,
  "minecraft:iron_helmet": 2, "minecraft:iron_chestplate": 6, "minecraft:iron_leggings": 5, "minecraft:iron_boots": 2,
  "minecraft:golden_helmet": 2, "minecraft:golden_chestplate": 5, "minecraft:golden_leggings": 3, "minecraft:golden_boots": 1,
  "minecraft:diamond_helmet": 3, "minecraft:diamond_chestplate": 8, "minecraft:diamond_leggings": 6, "minecraft:diamond_boots": 3,
  "minecraft:netherite_helmet": 3, "minecraft:netherite_chestplate": 8, "minecraft:netherite_leggings": 6, "minecraft:netherite_boots": 3,
  "minecraft:turtle_helmet": 2,
};
for (const [id, info] of OXIDIZING) ARMOR_POINTS[id] = OXIDIZING_SETS[info.set].points[info.piece];
const ARMOR_CAUSES = new Set(["entityAttack", "projectile", "entityExplosion", "blockExplosion", "anvil", "fallingBlock", "thorns"]);

// ---------- Clima ----------
let weather = "Clear";
let simulatedStorm = false;
system.run(() => {
  weather = world.getDynamicProperty("hydro:weather") ?? "Clear";
});
world.afterEvents.weatherChange.subscribe((ev) => {
  if (ev.dimension !== "minecraft:overworld" && ev.dimension !== "overworld") return;
  weather = ev.newWeather;
  world.setDynamicProperty("hydro:weather", weather);
});
const isThunder = () => simulatedStorm || weather === "Thunder";
const isRaining = () => simulatedStorm || weather === "Rain" || weather === "Thunder";

function underOpenSky(player) {
  try {
    const top = player.dimension.getTopmostBlock({ x: Math.floor(player.location.x), z: Math.floor(player.location.z) });
    return !top || top.location.y < player.location.y;
  } catch {
    return false;
  }
}

// ---------- Equipamento ----------
const equippable = (player) => player.getComponent("minecraft:equippable");

// Vale para qualquer estágio de oxidação.
function wearsSet(player, set) {
  const eq = equippable(player);
  if (!eq) return false;
  return SLOTS.every((slot, i) => {
    const info = OXIDIZING.get(eq.getEquipment(slot)?.typeId);
    return info?.set === set && info.piece === i;
  });
}

const oxidationStage = (item) => OXIDIZING.get(item?.typeId)?.stage ?? 0;

function refreshLore(item) {
  item.setLore([`§8Defesa Hydro: ${Math.round(OXIDATION_MULT[oxidationStage(item)] * 100)}%`]);
}

// Troca o item pela versão do estágio pedido, mantendo durabilidade, encantamentos e nome.
function withStage(item, stage) {
  const info = OXIDIZING.get(item.typeId);
  const next = new ItemStack(OXIDIZING_SETS[info.set].id(PIECES[info.piece], stage), 1);
  const oldDurability = item.getComponent("minecraft:durability");
  const newDurability = next.getComponent("minecraft:durability");
  if (oldDurability && newDurability) newDurability.damage = Math.min(oldDurability.damage, newDurability.maxDurability - 1);
  try {
    const enchantments = item.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
    if (enchantments.length) next.getComponent("minecraft:enchantable")?.addEnchantments(enchantments);
  } catch {}
  if (item.nameTag) next.nameTag = item.nameTag;
  next.setDynamicProperty("hydro:ox_progress", 0);
  refreshLore(next);
  return next;
}

function oxidizeTick(player) {
  const eq = equippable(player);
  if (!eq) return;
  const wet = player.isInWater || (isRaining() && underOpenSky(player));
  for (const slot of SLOTS) {
    const item = eq.getEquipment(slot);
    if (!item || !OXIDIZING.has(item.typeId)) continue;
    const stage = oxidationStage(item);
    if (stage >= OXIDATION_MULT.length - 1) continue;
    const progress = (item.getDynamicProperty("hydro:ox_progress") ?? 0) + (wet ? 2 : 1);
    if (progress >= OXIDATION_MINUTES) eq.setEquipment(slot, withStage(item, stage + 1));
    else {
      item.setDynamicProperty("hydro:ox_progress", progress);
      refreshLore(item);
      eq.setEquipment(slot, item);
    }
  }
}

// ---------- Fórmula de defesa ----------
function armorPoints(player) {
  const eq = equippable(player);
  let vanilla = 0;
  let hydro = 0;
  if (!eq) return { vanilla, hydro };
  for (const slot of SLOTS) {
    const item = eq.getEquipment(slot);
    if (!item) continue;
    const points = ARMOR_POINTS[item.typeId] ?? 0;
    vanilla += points;
    hydro += points * OXIDATION_MULT[oxidationStage(item)];
  }
  return { vanilla, hydro };
}

const vanillaReduction = (points) => Math.min(0.8, points * 0.04);
const hydroReduction = (points) => Math.min(DEFENSE_CAP, points * DEFENSE_PER_POINT);

// ---------- Raios ----------
const rodState = new Map(); // player.id -> { chargeUntil, cooldownUntil }
const rodChance = new Map(); // player.id -> chance atual
const plateChance = new Map();

// Rola a chance acumulativa: acertou volta à base, errou sobe um passo até o máximo.
function rollPity(store, id, cfg) {
  const chance = store.get(id) ?? cfg.base;
  if (Math.random() < chance) {
    store.set(id, cfg.base);
    return true;
  }
  store.set(id, Math.min(cfg.max, chance + cfg.step));
  return false;
}
const lightningShield = new Map(); // player.id -> { until, keep }

function sparks(dimension, location, count = 6) {
  for (let i = 0; i < count; i++) {
    const at = { x: location.x + (Math.random() - 0.5), y: location.y + 1 + Math.random() * 1.2, z: location.z + (Math.random() - 0.5) };
    try {
      dimension.spawnParticle("minecraft:electric_spark_particle", at);
    } catch {}
  }
}

function strikeLightning(dimension, location) {
  try {
    dimension.spawnEntity("minecraft:lightning_bolt", location);
  } catch {}
}

function rodTick(player) {
  const now = system.currentTick;
  const state = rodState.get(player.id) ?? { chargeUntil: 0, cooldownUntil: 0 };
  if (state.chargeUntil > now) {
    sparks(player.dimension, player.location);
    return;
  }
  if (state.chargeUntil && state.chargeUntil <= now) {
    state.chargeUntil = 0;
    state.cooldownUntil = now + ROD_COOLDOWN_TICKS;
    rodState.set(player.id, state);
    player.addEffect("fire_resistance", ROD_BUFF_TICKS, { amplifier: 0 });
    player.addEffect("regeneration", ROD_BUFF_TICKS, { amplifier: 0 });
    player.addEffect("speed", ROD_BUFF_TICKS, { amplifier: 1 });
    lightningShield.set(player.id, { until: now + 40, keep: ROD_DAMAGE_KEPT });
    strikeLightning(player.dimension, player.location);
    return;
  }
}

function maybeStartRod(player) {
  const now = system.currentTick;
  const state = rodState.get(player.id) ?? { chargeUntil: 0, cooldownUntil: 0 };
  if (state.chargeUntil || state.cooldownUntil > now) return;
  if (!isThunder() || !wearsSet(player, "copper") || !underOpenSky(player)) return;
  if (!rollPity(rodChance, player.id, ROD_CHANCE)) return;
  state.chargeUntil = now + ROD_CHARGE_TICKS;
  rodState.set(player.id, state);
  player.onScreenDisplay.setActionBar("§eSeu para-raios está atraindo um raio!");
}

world.afterEvents.entityHitEntity.subscribe((ev) => {
  const player = ev.damagingEntity;
  if (player?.typeId !== "minecraft:player" || !ev.hitEntity?.isValid) return;
  if (!isThunder() || !wearsSet(player, "plate") || !rollPity(plateChance, player.id, PLATE_CHANCE)) return;
  sparks(player.dimension, player.location, 10);
  lightningShield.set(player.id, { until: system.currentTick + 40, keep: 0 });
  strikeLightning(ev.hitEntity.dimension, ev.hitEntity.location);
});

// ---------- Dano ----------
world.afterEvents.entityHurt.subscribe((ev) => {
  const player = ev.hurtEntity;
  if (player?.typeId !== "minecraft:player" || !player.isValid) return;
  const health = player.getComponent("minecraft:health");
  if (!health || health.currentValue <= 0) return;
  const cause = ev.damageSource.cause;

  if (cause === "lightning") {
    const shield = lightningShield.get(player.id);
    if (shield && shield.until >= system.currentTick) {
      health.setCurrentValue(Math.min(health.effectiveMax, health.currentValue + ev.damage * (1 - shield.keep)));
      if (shield.keep === 0) player.extinguishFire();
    }
    return;
  }

  if (!ARMOR_CAUSES.has(cause)) return;
  const { vanilla, hydro } = armorPoints(player);
  const raw = ev.damage / (1 - vanillaReduction(vanilla));
  const extra = raw * (1 - hydroReduction(hydro)) - ev.damage;
  if (extra > 0.01) health.setCurrentValue(Math.max(0, health.currentValue - extra));
});

// ---------- Garimpo no caldeirão ----------
world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
  if (!ev.isFirstEvent || ev.block.typeId !== "minecraft:cauldron" || ev.itemStack?.typeId !== "minecraft:granite") return;
  ev.cancel = true;
  const { player, block } = ev;
  system.run(() => panForTin(player, block));
});

function panForTin(player, block) {
  if (!block.isValid || block.typeId !== "minecraft:cauldron") return;
  const level = block.permutation.getState("fill_level") ?? 0;
  const liquid = block.permutation.getState("cauldron_liquid");
  if (level <= 0 || (liquid !== undefined && liquid !== "water")) {
    player.onScreenDisplay.setActionBar("§7O caldeirão precisa de água para garimpar.");
    return;
  }

  if (player.getGameMode() !== GameMode.Creative) {
    const inv = player.getComponent("minecraft:inventory")?.container;
    const held = inv?.getItem(player.selectedSlotIndex);
    if (!held || held.typeId !== "minecraft:granite") return;
    if (held.amount > 1) {
      held.amount -= 1;
      inv.setItem(player.selectedSlotIndex, held);
    } else inv.setItem(player.selectedSlotIndex, undefined);
  }

  const { x, y, z } = block.location;
  const key = `hydro:cauldron:${block.dimension.id}:${x},${y},${z}`;
  const uses = (world.getDynamicProperty(key) ?? 0) + 1;
  if (uses >= USES_PER_WATER_LEVEL) {
    world.setDynamicProperty(key, undefined);
    block.setPermutation(block.permutation.withState("fill_level", Math.max(0, level - 2)));
  } else world.setDynamicProperty(key, uses);

  const top = { x: x + 0.5, y: y + 1, z: z + 0.5 };
  block.dimension.playSound("random.splash", top, { volume: 0.5 });
  try {
    block.dimension.spawnParticle("minecraft:water_splash_particle", top);
  } catch {}
  if (Math.random() < TIN_CHANCE) {
    block.dimension.spawnItem(new ItemStack("hydro:tin_nugget", 1), top);
    block.dimension.playSound("random.orb", top, { volume: 0.4 });
  }
}

// ---------- Loop ----------
system.runInterval(() => {
  const tick = system.currentTick;
  for (const player of world.getAllPlayers()) {
    if (!player.isValid) continue;
    rodTick(player);
    if (tick % (ROD_CHECK_SECONDS * 20) === 0) maybeStartRod(player);
    if (tick % 1200 === 0) oxidizeTick(player);
  }
}, 20);

// ---------- Comandos de teste: /scriptevent hydro:<comando> ----------
system.afterEvents.scriptEventReceive.subscribe((ev) => {
  const player = ev.sourceEntity;
  if (player?.typeId !== "minecraft:player") return;
  switch (ev.id) {
    case "hydro:defesa": {
      const { vanilla, hydro } = armorPoints(player);
      player.sendMessage(
        `§6Hydro§r: pontos ${vanilla} (vanilla ${Math.round(vanillaReduction(vanilla) * 100)}% de redução) ` +
          `→ Hydro ${hydro.toFixed(1)} pontos, ${Math.round(hydroReduction(hydro) * 100)}% de redução.`
      );
      break;
    }
    case "hydro:oxidar": {
      const eq = equippable(player);
      for (const slot of SLOTS) {
        const item = eq?.getEquipment(slot);
        if (!item || !OXIDIZING.has(item.typeId)) continue;
        eq.setEquipment(slot, withStage(item, Math.min(OXIDATION_MULT.length - 1, oxidationStage(item) + 1)));
      }
      player.sendMessage("§6Hydro§r: armaduras de cobre avançaram um estágio de oxidação.");
      break;
    }
    case "hydro:limpar": {
      const eq = equippable(player);
      for (const slot of SLOTS) {
        const item = eq?.getEquipment(slot);
        if (!item || !OXIDIZING.has(item.typeId)) continue;
        eq.setEquipment(slot, withStage(item, 0));
      }
      player.sendMessage("§6Hydro§r: oxidação removida.");
      break;
    }
    case "hydro:chances": {
      const pct = (store, cfg) => Math.round((store.get(player.id) ?? cfg.base) * 100);
      player.sendMessage(`§6Hydro§r: para-raios ${pct(rodChance, ROD_CHANCE)}%, placas ${pct(plateChance, PLATE_CHANCE)}%.`);
      break;
    }
    case "hydro:tempestade": {
      simulatedStorm = !simulatedStorm;
      player.sendMessage(`§6Hydro§r: tempestade simulada ${simulatedStorm ? "ligada" : "desligada"}.`);
      break;
    }
    case "hydro:raio": {
      rodState.set(player.id, { chargeUntil: system.currentTick + ROD_CHARGE_TICKS, cooldownUntil: 0 });
      player.sendMessage("§6Hydro§r: forçando o para-raios.");
      break;
    }
  }
});
