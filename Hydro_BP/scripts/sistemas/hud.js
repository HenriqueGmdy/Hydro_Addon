// Mostra a Defesa Hydro no lugar da barra de armadura vanilla.
// O valor vai num título com o prefixo "hydro:def:", que o hud_screen.json do RP esconde e guarda (ver Hydro_RP/ui).
import { world } from "@minecraft/server";
import { defesaDoJogador, reducaoHydro } from "./defesa.js";

const ultimoEnviado = new Map(); // player.id -> texto

world.afterEvents.playerSpawn.subscribe((ev) => ultimoEnviado.delete(ev.player.id));
world.afterEvents.playerLeave.subscribe((ev) => ultimoEnviado.delete(ev.playerId));

export function textoDaDefesa(player) {
  const { hydro } = defesaDoJogador(player);
  if (hydro <= 0) return "";
  return `${hydro.toFixed(1)} §7(${Math.round(reducaoHydro(hydro) * 100)}%)`;
}

export function atualizarHud(player) {
  const texto = textoDaDefesa(player);
  if (ultimoEnviado.get(player.id) === texto) return;
  ultimoEnviado.set(player.id, texto);
  player.onScreenDisplay.setTitle(`hydro:def:${texto || " "}`, { fadeInDuration: 0, stayDuration: 1, fadeOutDuration: 0 });
}
