// Todos os números de balanceamento do Hydro ficam aqui.

// ---------- Defesa ----------
// Dano que passa = 1 - D / (D + DEFESA_K). D do set = defesa do tier × multiplicador da classe.
export const DEFESA_K = 30;
export const DEFESA_POR_TIER = { 2: 5, 3: 10, 4: 18, 5: 28, 6: 40, 7: 55, 8: 75 };
export const MULT_CLASSE = { mago: 0.45, ranged: 0.7, default: 1, melee: 1.5 };
export const PARTE_DA_PECA = [0.15, 0.4, 0.3, 0.15]; // capacete, peitoral, calça, botas
export const CAUSAS_COM_ARMADURA = ["entityAttack", "projectile", "entityExplosion", "blockExplosion", "anvil", "fallingBlock", "thorns"];

// ---------- Oxidação ----------
export const OXIDACAO_MULT = [1, 0.85, 0.7, 0.5]; // defesa por estágio
export const OXIDACAO_MINUTOS = 20; // minutos vestida para subir um estágio (dobra na chuva ou na água)

// ---------- Raios (cobre e bronze) ----------
// Chances acumulativas: começam na base, sobem a cada falha até o máximo e voltam à base quando o raio cai.
export const PARA_RAIOS_SEGUNDOS = 10; // a cada quantos segundos o para-raios tenta atrair um raio
export const CHANCE_PARA_RAIOS = { base: 0.05, passo: 0.05, max: 0.25 };
export const CHANCE_PLACAS = { base: 0.05, passo: 0.05, max: 0.25 }; // por golpe
export const PARA_RAIOS_CARGA_TICKS = 70; // faíscas antes do raio (3,5 s)
export const PARA_RAIOS_RECARGA_TICKS = 1200;
export const PARA_RAIOS_BUFF_TICKS = 300; // 15 s de efeitos e de brilho
export const COBRE_DANO_DO_RAIO = 0.5; // fração do dano do raio que o cobre deixa passar (bronze é imune)

// ---------- Habilidades ----------
export const COURO_BATIDO = { duracao: 60, recarga: 800 }; // Resistência I por 3 s, recarga de 40 s
export const PLACAS_DE_FERRO = { duracao: 200, recarga: 800, bonusEspada: 0.2 }; // 10 s, 40 s, +20% com espadas
export const RANGER_FERRO = { bonusFlecha: 0.15 }; // +15% de dano com flechas
export const RANGER_OURO = { chanceEconomizar: 0.2 }; // 20% de chance de não gastar a flecha
export const DIAMANTE = { vidaMinima: 8, duracao: 100, recarga: 1200 }; // 4 corações, 5 s, 60 s

// ---------- Minérios ----------
// Fortuna em ferro e ouro: multiplica a quantidade por (1 + nível × FORTUNA_PROPORCAO).
export const FORTUNA_PROPORCAO = 1 / 3;
export const MINERIOS = {
  "minecraft:iron_ore": { drop: "hydro:raw_iron_nugget", min: 3, max: 6, fortuna: "proporcional", vanilla: "minecraft:raw_iron" },
  "minecraft:deepslate_iron_ore": { drop: "hydro:raw_iron_nugget", min: 3, max: 6, fortuna: "proporcional", vanilla: "minecraft:raw_iron" },
  "minecraft:gold_ore": { drop: "hydro:raw_gold_nugget", min: 3, max: 4, fortuna: "proporcional", vanilla: "minecraft:raw_gold" },
  "minecraft:deepslate_gold_ore": { drop: "hydro:raw_gold_nugget", min: 3, max: 4, fortuna: "proporcional", vanilla: "minecraft:raw_gold" },
  "minecraft:diamond_ore": { drop: "hydro:raw_diamond_nugget", min: 2, max: 3, fortuna: "+1", vanilla: "minecraft:diamond" },
  "minecraft:deepslate_diamond_ore": { drop: "hydro:raw_diamond_nugget", min: 2, max: 3, fortuna: "+1", vanilla: "minecraft:diamond" },
};

// ---------- Caldeirão ----------
export const CHANCE_ESTANHO = 0.6;
export const GARIMPOS_POR_NIVEL = 3; // usos de granito por "garrafa" de água
// O caldeirão tem 6 níveis. Água e poção: um balde enche tudo, uma garrafa enche 2 níveis.
export const BLOCOS_NO_CALDEIRAO = {
  "minecraft:slime_ball": { conteudo: "slime", porItem: 1, bloco: "minecraft:slime" }, // 6 bolas
  "minecraft:magma_cream": { conteudo: "magma", porItem: 2, bloco: "minecraft:magma" }, // 3 cremes
  "minecraft:honey_bottle": { conteudo: "mel", porItem: 2, bloco: "minecraft:honey_block", devolve: "minecraft:glass_bottle" }, // 3 frascos
};
