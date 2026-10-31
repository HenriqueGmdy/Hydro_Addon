// Hydro Addon: ponto de entrada do script.
// Cada sistema fica em scripts/sistemas; números de balanceamento em scripts/config.js;
// a tabela de armaduras é gerada em scripts/dados/armaduras.js (npm run gerar).
import { system, world } from "@minecraft/server";
import "./sistemas/defesa.js"; // primeiro: as habilidades que olham a vida precisam do dano já corrigido
import "./sistemas/minerios.js";
import "./sistemas/caldeirao.js";
import "./sistemas/comandos.js";
import { habilidadesPorSegundo } from "./sistemas/habilidades.js";
import { atualizarHud } from "./sistemas/hud.js";
import { descreverVestidas, oxidar } from "./sistemas/oxidacao.js";
import { raiosPorSegundo } from "./sistemas/raios.js";

system.runInterval(() => {
  const minuto = system.currentTick % 1200 < 20;
  for (const player of world.getAllPlayers()) {
    if (!player.isValid) continue;
    raiosPorSegundo(player);
    habilidadesPorSegundo(player);
    atualizarHud(player);
    descreverVestidas(player);
    if (minuto) oxidar(player);
  }
}, 20);
