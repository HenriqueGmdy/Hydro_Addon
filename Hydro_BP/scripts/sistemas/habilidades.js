// Habilidades de set completo que não envolvem raios.
import { EntityDamageCause, GameMode, ItemStack, system, world } from "@minecraft/server";
import { COURO_BATIDO, DIAMANTE, PLACAS_DE_FERRO, RANGER_FERRO, RANGER_OURO } from "../config.js";
import { naMao, vesteSet, vesteSetComCapacete } from "../util/equipamento.js";

const recargas = new Map(); // `${habilidade}:${player.id}` -> tick em que libera

function usarRecarga(habilidade, player, ticks) {
  const chave = `${habilidade}:${player.id}`;
  const agora = system.currentTick;
  if ((recargas.get(chave) ?? 0) > agora) return false;
  recargas.set(chave, agora + ticks);
  return true;
}

const ATAQUES = new Set(["entityAttack", "projectile"]);
const ehEspada = (item) => !!item?.typeId.endsWith("_sword");

// Dano extra aplicado à parte (causa "override" não passa pela fórmula de defesa nem dispara bônus de novo).
function danoExtra(alvo, quantidade) {
  if (quantidade > 0.05 && alvo.isValid) alvo.applyDamage(quantidade, { cause: EntityDamageCause.override });
}

world.afterEvents.entityHurt.subscribe((ev) => {
  const alvo = ev.hurtEntity;
  const causa = ev.damageSource.cause;

  // Quem recebeu o golpe.
  if (alvo?.typeId === "minecraft:player" && alvo.isValid) {
    const vida = alvo.getComponent("minecraft:health");
    if (vida && vida.currentValue > 0) {
      if (ATAQUES.has(causa)) {
        if (vesteSet(alvo, "studded_leather") && usarRecarga("couro_batido", alvo, COURO_BATIDO.recarga))
          alvo.addEffect("resistance", COURO_BATIDO.duracao, { amplifier: 0 });
        if (vesteSet(alvo, "iron_plate") && usarRecarga("placas_de_ferro", alvo, PLACAS_DE_FERRO.recarga))
          alvo.addEffect("resistance", PLACAS_DE_FERRO.duracao, { amplifier: 0 });
      }
      if (causa === "freezing" && vesteSet(alvo, "fur")) vida.setCurrentValue(Math.min(vida.effectiveMax, vida.currentValue + ev.damage));
      if (vida.currentValue <= DIAMANTE.vidaMinima && vesteSet(alvo, "diamond") && usarRecarga("diamante", alvo, DIAMANTE.recarga)) {
        alvo.addEffect("regeneration", DIAMANTE.duracao, { amplifier: 0 });
        alvo.addEffect("resistance", DIAMANTE.duracao, { amplifier: 1 });
      }
    }
  }

  // Quem bateu.
  const atacante = ev.damageSource.damagingEntity;
  if (atacante?.typeId !== "minecraft:player" || !alvo?.isValid) return;
  if (causa === "entityAttack" && ehEspada(naMao(atacante)) && vesteSet(atacante, "iron_plate"))
    danoExtra(alvo, ev.damage * PLACAS_DE_FERRO.bonusEspada);
  if (causa === "projectile" && ev.damageSource.damagingProjectile?.typeId === "minecraft:arrow" && vesteSetComCapacete(atacante, "iron_ranger", "iron"))
    danoExtra(alvo, ev.damage * RANGER_FERRO.bonusFlecha);
});

// Ranger de ouro: chance de não gastar a flecha ao atirar com o arco.
world.afterEvents.itemReleaseUse.subscribe((ev) => {
  const player = ev.source;
  if (ev.itemStack?.typeId !== "minecraft:bow" || player.getGameMode() === GameMode.Creative) return;
  if (!vesteSetComCapacete(player, "golden_ranger", "golden")) return;
  if (ev.itemStack.getComponent("minecraft:enchantable")?.hasEnchantment("infinity")) return;
  if (Math.random() >= RANGER_OURO.chanceEconomizar) return;
  player.getComponent("minecraft:inventory")?.container?.addItem(new ItemStack("minecraft:arrow", 1));
});

// Efeitos contínuos, renovados a cada segundo.
const efeito = (player, id, amplificador = 0) => player.addEffect(id, 60, { amplifier: amplificador, showParticles: false });

export function habilidadesPorSegundo(player) {
  if (vesteSet(player, "nickel") && player.isInWater) efeito(player, "conduit_power");
  if (vesteSet(player, "magmarine")) {
    efeito(player, "fire_resistance");
    if (player.isInWater) efeito(player, "conduit_power");
  }
}
