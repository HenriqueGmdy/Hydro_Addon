// Raios das armaduras de cobre e bronze: para-raios, raio no golpe das placas e tridente carregado.
import { EnchantmentTypes, GameMode, system, world } from "@minecraft/server";
import {
  CHANCE_PARA_RAIOS, CHANCE_PLACAS, COBRE_DANO_DO_RAIO, PARA_RAIOS_BUFF_TICKS, PARA_RAIOS_CARGA_TICKS,
  PARA_RAIOS_RECARGA_TICKS, PARA_RAIOS_SEGUNDOS,
} from "../config.js";
import { aCeuAberto, temTrovoada } from "../util/clima.js";
import { SLOTS, equipavel, infoDe, naMao, trocarVariante, vesteSet } from "../util/equipamento.js";

const estadoParaRaios = new Map(); // player.id -> { cargaAte, recargaAte, brilhoAte }
export const chanceParaRaios = new Map(); // player.id -> chance atual
export const chancePlacas = new Map();
const escudoContraRaio = new Map(); // player.id -> { ate, passa }
const tridenteCarregado = new Set(); // jogadores de bronze com o próximo ataque de tridente carregado

// Rola a chance acumulativa: acertou volta à base, errou sobe um passo até o máximo.
export function rolarAcumulativa(guarda, id, cfg) {
  const chance = guarda.get(id) ?? cfg.base;
  if (Math.random() < chance) {
    guarda.set(id, cfg.base);
    return true;
  }
  guarda.set(id, Math.min(cfg.max, chance + cfg.passo));
  return false;
}

function faiscas(dimensao, local, quantidade = 6) {
  for (let i = 0; i < quantidade; i++) {
    const ponto = { x: local.x + (Math.random() - 0.5), y: local.y + 1 + Math.random() * 1.2, z: local.z + (Math.random() - 0.5) };
    try {
      dimensao.spawnParticle("minecraft:electric_spark_particle", ponto);
    } catch {}
  }
}

function soltarRaio(dimensao, local) {
  try {
    dimensao.spawnEntity("minecraft:lightning_bolt", local);
  } catch {}
}

const conjuntoParaRaios = (player) => (vesteSet(player, "bronze") ? "bronze" : vesteSet(player, "copper") ? "copper" : undefined);

// Liga ou desliga o brilho das peças vestidas.
function trocarBrilho(player, ligado) {
  const eq = equipavel(player);
  if (!eq) return;
  for (const slot of SLOTS) {
    const item = eq.getEquipment(slot);
    const info = infoDe(item);
    if (!info || info.carregado === ligado) continue;
    if (ligado && info.conjunto !== "copper" && info.conjunto !== "bronze") continue;
    eq.setEquipment(slot, trocarVariante(item, info.estagio, ligado));
  }
}

// Peças com brilho que ficaram no inventário (tiradas durante o efeito) voltam ao normal.
function apagarBrilhoDoInventario(player) {
  const inv = player.getComponent("minecraft:inventory")?.container;
  if (!inv) return;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    const info = infoDe(item);
    if (info?.carregado) inv.setItem(i, trocarVariante(item, info.estagio, false));
  }
}

export function forcarParaRaios(player) {
  estadoParaRaios.set(player.id, { cargaAte: system.currentTick + PARA_RAIOS_CARGA_TICKS, recargaAte: 0, brilhoAte: 0 });
}

function cairRaio(player, estado, conjunto) {
  const agora = system.currentTick;
  estado.cargaAte = 0;
  estado.recargaAte = agora + PARA_RAIOS_RECARGA_TICKS;
  estado.brilhoAte = agora + PARA_RAIOS_BUFF_TICKS;
  player.addEffect("fire_resistance", PARA_RAIOS_BUFF_TICKS, { amplifier: 0 });
  player.addEffect("regeneration", PARA_RAIOS_BUFF_TICKS, { amplifier: 0 });
  player.addEffect("speed", PARA_RAIOS_BUFF_TICKS, { amplifier: 1 });
  escudoContraRaio.set(player.id, { ate: agora + 40, passa: conjunto === "bronze" ? 0 : COBRE_DANO_DO_RAIO });
  if (conjunto === "bronze") tridenteCarregado.add(player.id);
  trocarBrilho(player, true);
  soltarRaio(player.dimension, player.location);
}

function tentarParaRaios(player) {
  const agora = system.currentTick;
  const estado = estadoParaRaios.get(player.id) ?? { cargaAte: 0, recargaAte: 0, brilhoAte: 0 };
  if (estado.cargaAte || estado.recargaAte > agora) return;
  if (!temTrovoada() || !conjuntoParaRaios(player) || !aCeuAberto(player)) return;
  if (!rolarAcumulativa(chanceParaRaios, player.id, CHANCE_PARA_RAIOS)) return;
  estado.cargaAte = agora + PARA_RAIOS_CARGA_TICKS;
  estadoParaRaios.set(player.id, estado);
  player.onScreenDisplay.setActionBar("§eSeu para-raios está atraindo um raio!");
}

// Lealdade do tridente com o bronze completo: posta e tirada pelo script, marcada no item.
function lealdadeDoBronze(player, temBronze) {
  const inv = player.getComponent("minecraft:inventory")?.container;
  if (!inv) return;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (item?.typeId !== "minecraft:trident") continue;
    const encantavel = item.getComponent("minecraft:enchantable");
    if (!encantavel) continue;
    const marcado = item.getDynamicProperty("hydro:lealdade_bronze") === true;
    try {
      if (temBronze && !marcado && !encantavel.hasEnchantment("loyalty") && !encantavel.hasEnchantment("riptide")) {
        encantavel.addEnchantment({ type: EnchantmentTypes.get("loyalty"), level: 1 });
        item.setDynamicProperty("hydro:lealdade_bronze", true);
        inv.setItem(i, item);
      } else if (!temBronze && marcado) {
        encantavel.removeEnchantment("loyalty");
        item.setDynamicProperty("hydro:lealdade_bronze", undefined);
        inv.setItem(i, item);
      }
    } catch {}
  }
}

function raioDoTridente(player, alvo) {
  if (!tridenteCarregado.has(player.id) || !alvo?.isValid) return;
  tridenteCarregado.delete(player.id);
  faiscas(player.dimension, player.location, 10);
  escudoContraRaio.set(player.id, { ate: system.currentTick + 40, passa: 0 });
  soltarRaio(alvo.dimension, alvo.location);
}

world.afterEvents.entityHitEntity.subscribe((ev) => {
  const player = ev.damagingEntity;
  if (player?.typeId !== "minecraft:player" || !ev.hitEntity?.isValid) return;
  if (naMao(player)?.typeId === "minecraft:trident") raioDoTridente(player, ev.hitEntity);
  if (!temTrovoada() || !vesteSet(player, "copper_plate") || !rolarAcumulativa(chancePlacas, player.id, CHANCE_PLACAS)) return;
  faiscas(player.dimension, player.location, 10);
  escudoContraRaio.set(player.id, { ate: system.currentTick + 40, passa: 0 });
  soltarRaio(ev.hitEntity.dimension, ev.hitEntity.location);
});

world.afterEvents.projectileHitEntity.subscribe((ev) => {
  if (ev.projectile?.typeId !== "minecraft:thrown_trident" || ev.source?.typeId !== "minecraft:player") return;
  raioDoTridente(ev.source, ev.getEntityHit()?.entity);
});

// Raio: o cobre deixa passar metade, o bronze e os raios do próprio jogador não ferem.
world.afterEvents.entityHurt.subscribe((ev) => {
  const player = ev.hurtEntity;
  if (player?.typeId !== "minecraft:player" || ev.damageSource.cause !== "lightning" || !player.isValid) return;
  const vida = player.getComponent("minecraft:health");
  if (!vida || vida.currentValue <= 0) return;
  const escudo = escudoContraRaio.get(player.id);
  let passa = escudo && escudo.ate >= system.currentTick ? escudo.passa : 1;
  if (vesteSet(player, "bronze")) passa = 0;
  if (passa >= 1) return;
  vida.setCurrentValue(Math.min(vida.effectiveMax, vida.currentValue + ev.damage * (1 - passa)));
  if (passa === 0) player.extinguishFire();
});

// Faíscas durante a carga, a cada 4 ticks.
system.runInterval(() => {
  const agora = system.currentTick;
  for (const player of world.getAllPlayers()) {
    const estado = estadoParaRaios.get(player.id);
    if (!estado?.cargaAte || !player.isValid) continue;
    if (estado.cargaAte > agora) faiscas(player.dimension, player.location, 4);
    else cairRaio(player, estado, conjuntoParaRaios(player) ?? "copper");
  }
}, 4);

// Chamado a cada segundo para cada jogador.
export function raiosPorSegundo(player) {
  const agora = system.currentTick;
  const estado = estadoParaRaios.get(player.id);
  if (agora % (PARA_RAIOS_SEGUNDOS * 20) < 20) tentarParaRaios(player);
  if (!estado || estado.brilhoAte <= agora) {
    trocarBrilho(player, false);
    if (player.getGameMode() !== GameMode.Spectator) apagarBrilhoDoInventario(player);
  }
  lealdadeDoBronze(player, vesteSet(player, "bronze"));
}
