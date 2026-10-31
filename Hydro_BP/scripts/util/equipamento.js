import { EquipmentSlot, ItemStack } from "@minecraft/server";
import { ARMADURAS, idDaPeca } from "../dados/armaduras.js";

export const SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];

export const equipavel = (player) => player.getComponent("minecraft:equippable");
export const infoDe = (item) => (item ? ARMADURAS[item.typeId] : undefined);

// Conjunto de cada slot (capacete, peitoral, calça, botas); undefined se vazio ou não for armadura.
export function conjuntosVestidos(player) {
  const eq = equipavel(player);
  return SLOTS.map((slot, i) => {
    const info = infoDe(eq?.getEquipment(slot));
    return info?.peca === i ? info.conjunto : undefined;
  });
}

// Set completo: as quatro peças do conjunto (vale para qualquer estágio de oxidação).
export const vesteSet = (player, conjunto) => conjuntosVestidos(player).every((c) => c === conjunto);

// Set completo com um capacete de classe (ex.: capacete ranger de ferro + resto de ferro).
export function vesteSetComCapacete(player, capacete, conjunto) {
  const [cabeca, ...resto] = conjuntosVestidos(player);
  return cabeca === capacete && resto.every((c) => c === conjunto);
}

export const naMao = (player) => player.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);

// Troca uma peça por outra variante (estágio ou brilho), mantendo durabilidade, encantamentos, nome e dados.
export function trocarVariante(item, estagio, carregado) {
  const info = infoDe(item);
  const novo = new ItemStack(idDaPeca(info.conjunto, info.peca, estagio, carregado), 1);
  const antiga = item.getComponent("minecraft:durability");
  const nova = novo.getComponent("minecraft:durability");
  if (antiga && nova) nova.damage = Math.min(antiga.damage, nova.maxDurability - 1);
  try {
    const encantamentos = item.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
    if (encantamentos.length) novo.getComponent("minecraft:enchantable")?.addEnchantments(encantamentos);
  } catch {}
  if (item.nameTag) novo.nameTag = item.nameTag;
  for (const chave of item.getDynamicPropertyIds()) novo.setDynamicProperty(chave, item.getDynamicProperty(chave));
  return novo;
}
