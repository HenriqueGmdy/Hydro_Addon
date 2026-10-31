// Comandos de teste: /scriptevent hydro:<comando>
import { Player, system } from "@minecraft/server";
import { CHANCE_PARA_RAIOS, CHANCE_PLACAS } from "../config.js";
import { alternarTempestadeSimulada } from "../util/clima.js";
import { SLOTS, equipavel, infoDe } from "../util/equipamento.js";
import { defesaDoJogador, reducaoHydro, reducaoVanilla } from "./defesa.js";
import { ULTIMO_ESTAGIO, mudarEstagio, oxida } from "./oxidacao.js";
import { chanceParaRaios, chancePlacas, forcarParaRaios } from "./raios.js";

function mudarOxidacao(player, passo) {
  const eq = equipavel(player);
  for (const slot of SLOTS) {
    const item = eq?.getEquipment(slot);
    if (!oxida(item)) continue;
    const alvo = passo === 0 ? 0 : Math.min(ULTIMO_ESTAGIO, infoDe(item).estagio + passo);
    eq.setEquipment(slot, mudarEstagio(item, alvo));
  }
}

system.afterEvents.scriptEventReceive.subscribe((ev) => {
  const player = ev.sourceEntity;
  if (!(player instanceof Player)) return;
  switch (ev.id) {
    case "hydro:defesa": {
      const { vanilla, hydro } = defesaDoJogador(player);
      player.sendMessage(
        `§6Hydro§r: vanilla ${vanilla} pontos (${Math.round(reducaoVanilla(vanilla) * 100)}% de redução) ` +
          `→ Defesa Hydro ${hydro.toFixed(1)}, passa ${Math.round((1 - reducaoHydro(hydro)) * 100)}% do dano.`
      );
      break;
    }
    case "hydro:oxidar":
      mudarOxidacao(player, 1);
      player.sendMessage("§6Hydro§r: armaduras de cobre avançaram um estágio de oxidação.");
      break;
    case "hydro:limpar":
      mudarOxidacao(player, 0);
      player.sendMessage("§6Hydro§r: oxidação removida.");
      break;
    case "hydro:chances": {
      const pct = (guarda, cfg) => Math.round((guarda.get(player.id) ?? cfg.base) * 100);
      player.sendMessage(`§6Hydro§r: para-raios ${pct(chanceParaRaios, CHANCE_PARA_RAIOS)}%, placas ${pct(chancePlacas, CHANCE_PLACAS)}%.`);
      break;
    }
    case "hydro:tempestade":
      player.sendMessage(`§6Hydro§r: tempestade simulada ${alternarTempestadeSimulada() ? "ligada" : "desligada"}.`);
      break;
    case "hydro:raio":
      forcarParaRaios(player);
      player.sendMessage("§6Hydro§r: forçando o para-raios.");
      break;
  }
});
