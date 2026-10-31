import { system, world } from "@minecraft/server";

let clima = "Clear";
let tempestadeSimulada = false;

system.run(() => {
  clima = String(world.getDynamicProperty("hydro:weather") ?? "Clear");
});
world.afterEvents.weatherChange.subscribe((ev) => {
  if (ev.dimension !== "minecraft:overworld" && ev.dimension !== "overworld") return;
  clima = ev.newWeather;
  world.setDynamicProperty("hydro:weather", clima);
});

export const temTrovoada = () => tempestadeSimulada || clima === "Thunder";
export const estaChovendo = () => tempestadeSimulada || clima === "Rain" || clima === "Thunder";
export function alternarTempestadeSimulada() {
  tempestadeSimulada = !tempestadeSimulada;
  return tempestadeSimulada;
}

export function aCeuAberto(player) {
  try {
    const topo = player.dimension.getTopmostBlock({ x: Math.floor(player.location.x), z: Math.floor(player.location.z) });
    return !topo || topo.location.y < player.location.y;
  } catch {
    return false;
  }
}
