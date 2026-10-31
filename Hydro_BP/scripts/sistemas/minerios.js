// Minérios de ferro, ouro e diamante dropam pepitas cruas.
// O jogo solta o drop vanilla normalmente; no tick seguinte o script troca esse drop pelas pepitas.
// Assim a regra de picareta certa continua a do vanilla: sem drop vanilla, sem pepitas.
import { ItemStack, system, world } from "@minecraft/server";
import { FORTUNA_PROPORCAO, MINERIOS } from "../config.js";

const sortear = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function quantidade(minerio, fortuna) {
  const base = sortear(minerio.min, minerio.max);
  if (minerio.fortuna === "+1") return base + fortuna;
  return Math.round(base * (1 + fortuna * FORTUNA_PROPORCAO));
}

world.afterEvents.playerBreakBlock.subscribe((ev) => {
  const minerio = MINERIOS[ev.brokenBlockPermutation.type.id];
  if (!minerio) return;
  const encantavel = ev.itemStackBeforeBreak?.getComponent("minecraft:enchantable");
  if (encantavel?.hasEnchantment("silk_touch")) return;
  const fortuna = encantavel?.getEnchantment("fortune")?.level ?? 0;
  const { dimension } = ev;
  const centro = { x: ev.block.location.x + 0.5, y: ev.block.location.y + 0.5, z: ev.block.location.z + 0.5 };

  system.run(() => {
    let achou = false;
    for (const entidade of dimension.getEntities({ type: "minecraft:item", location: centro, maxDistance: 1.5 })) {
      const item = entidade.getComponent("minecraft:item")?.itemStack;
      if (item?.typeId !== minerio.vanilla) continue;
      achou = true;
      entidade.remove();
    }
    if (!achou) return;
    let restante = quantidade(minerio, fortuna);
    while (restante > 0) {
      const pilha = Math.min(64, restante);
      dimension.spawnItem(new ItemStack(minerio.drop, pilha), centro);
      restante -= pilha;
    }
  });
});
