// Fórmula de defesa do Hydro: recalcula o dano recebido por cima da conta vanilla.
import { world } from "@minecraft/server";
import { CAUSAS_COM_ARMADURA, DEFESA_K, DEFESA_POR_TIER, MULT_CLASSE, OXIDACAO_MULT, PARTE_DA_PECA } from "../config.js";
import { SLOTS, equipavel, infoDe } from "../util/equipamento.js";

const CAUSAS = new Set(CAUSAS_COM_ARMADURA);

// Defesa Hydro de uma peça, já com a oxidação.
export function defesaDaPeca(item) {
  const info = infoDe(item);
  if (!info) return 0;
  return DEFESA_POR_TIER[info.tier] * MULT_CLASSE[info.classe] * PARTE_DA_PECA[info.peca] * OXIDACAO_MULT[info.estagio];
}

export function defesaDoJogador(player) {
  const eq = equipavel(player);
  let vanilla = 0;
  let hydro = 0;
  for (const slot of SLOTS) {
    const item = eq?.getEquipment(slot);
    vanilla += infoDe(item)?.pontos ?? 0;
    hydro += defesaDaPeca(item);
  }
  return { vanilla, hydro };
}

export const reducaoVanilla = (pontos) => Math.min(0.8, pontos * 0.04);
export const reducaoHydro = (defesa) => defesa / (defesa + DEFESA_K);

world.afterEvents.entityHurt.subscribe((ev) => {
  const player = ev.hurtEntity;
  if (player?.typeId !== "minecraft:player" || !player.isValid) return;
  if (!CAUSAS.has(ev.damageSource.cause)) return;
  const vida = player.getComponent("minecraft:health");
  if (!vida || vida.currentValue <= 0) return;
  const { vanilla, hydro } = defesaDoJogador(player);
  const bruto = ev.damage / (1 - reducaoVanilla(vanilla));
  const diferenca = bruto * (1 - reducaoHydro(hydro)) - ev.damage;
  if (diferenca > 0.01) vida.setCurrentValue(Math.max(0, vida.currentValue - diferenca));
  else if (diferenca < -0.01) vida.setCurrentValue(Math.min(vida.effectiveMax, vida.currentValue - diferenca));
});
