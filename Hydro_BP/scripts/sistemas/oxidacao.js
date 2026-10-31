// Oxidação das armaduras de cobre: sobe um estágio a cada OXIDACAO_MINUTOS vestida (o dobro molhada).
import { OXIDACAO_MINUTOS, OXIDACAO_MULT } from "../config.js";
import { CONJUNTOS } from "../dados/armaduras.js";
import { estaChovendo, aCeuAberto } from "../util/clima.js";
import { SLOTS, equipavel, infoDe, trocarVariante } from "../util/equipamento.js";
import { defesaDaPeca } from "./defesa.js";

export const ULTIMO_ESTAGIO = OXIDACAO_MULT.length - 1;
export const oxida = (item) => {
  const info = infoDe(item);
  return !!info && CONJUNTOS[info.conjunto].estagios && !info.carregado;
};

export function atualizarDescricao(item) {
  const info = infoDe(item);
  if (!info) return;
  const linhas = [`§8Defesa Hydro: ${defesaDaPeca(item).toFixed(1)}`];
  if (CONJUNTOS[info.conjunto].estagios) linhas.push(`§8Oxidação: ${Math.round(OXIDACAO_MULT[info.estagio] * 100)}% da defesa`);
  item.setLore(linhas);
}

export function mudarEstagio(item, estagio) {
  const novo = trocarVariante(item, estagio, false);
  novo.setDynamicProperty("hydro:ox_progress", 0);
  atualizarDescricao(novo);
  return novo;
}

// Chamado uma vez por minuto para cada jogador.
export function oxidar(player) {
  const eq = equipavel(player);
  if (!eq) return;
  const molhado = player.isInWater || (estaChovendo() && aCeuAberto(player));
  for (const slot of SLOTS) {
    const item = eq.getEquipment(slot);
    if (!oxida(item)) continue;
    const { estagio } = infoDe(item);
    if (estagio >= ULTIMO_ESTAGIO) continue;
    const progresso = (item.getDynamicProperty("hydro:ox_progress") ?? 0) + (molhado ? 2 : 1);
    if (progresso >= OXIDACAO_MINUTOS) eq.setEquipment(slot, mudarEstagio(item, estagio + 1));
    else {
      item.setDynamicProperty("hydro:ox_progress", progresso);
      atualizarDescricao(item);
      eq.setEquipment(slot, item);
    }
  }
}

// Garante que toda armadura vestida mostre a Defesa Hydro na descrição.
export function descreverVestidas(player) {
  const eq = equipavel(player);
  if (!eq) return;
  for (const slot of SLOTS) {
    const item = eq.getEquipment(slot);
    if (!infoDe(item) || item.getLore().length) continue;
    atualizarDescricao(item);
    eq.setEquipment(slot, item);
  }
}
