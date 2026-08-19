/* =====================================================================
 * TUDO QUE O APP FALA COM A ISABELA MORA AQUI.
 * Benjamin: pode editar este arquivo à vontade — é só texto.
 * ===================================================================== */

/** Linha rotativa embaixo do cabeçalho (troca a cada abertura). */
export const RECADINHOS_DO_TOPO = [
  'você consegue, amor 💪💗',
  'to muito orgulhoso de você',
  'mais um dia, mais perto 🌸',
  'eu tô te vendo daqui, viu? 👀💗',
  'cada dia desse é por nós dois',
  'olha só como você tá indo 🥺',
  'a mulher mais linda do mundo é você',
]

/** Frase carinhosa que abre a tela do dia, por tipo de dia. */
export const FRASES_DO_DIA = {
  treino: [
    'bora, amor? é só hoje de novo 💗',
    'depois desse aqui você vai tá orgulhosa',
    '40 minutinhos e o dia tá feito 🌸',
    'vai devagar, mas vai. eu tô aqui',
  ],
  bonus: [
    'hoje é bônus — se der, deu. se não der, tá tudo certo 💗',
    'dia livre! se você for, ganha estrelinha ⭐',
    'sem cobrança nenhuma hoje, viu?',
  ],
  folguinha: [
    'hoje é dia de descansar, seu corpo tá construindo o resultado 💗',
    'folga merecida. descansa que amanhã a gente volta 💤',
    'deita, assiste algo, come bem. hoje é seu 🌸',
  ],
} as const

/* As cartinhas de cada dia moram em conteudo/cartas.ts */

/** Mensagem final da tela de 01/09. */
export const CARTA_FINAL = {
  titulo: 'Você conseguiu, Isabela 💗',
  texto: `Foram 15 dias. Você correu, nadou, bebeu água, tirou foto todo dia e não desistiu quando ficou chato.

Eu te acompanhei de longe em cada quadradinho que você pintou aqui.

Orgulho é pouco.`,
  assinatura: 'com amor, Benjamin',
}

/** Frases do timer da corrida. */
export const TIMER = {
  caminhar: 'respira, caminha 🌸',
  correr: 'VAI ISABELA! 🔥💗',
  fim: 'você terminou, amor. 40 minutos completinhos 💗',
  confirmarSaida: 'quer parar mesmo? falta pouquinho 🥺',
}

/**
 * A festa que aparece quando ela bate a meta de água.
 * Benjamin: essas três linhas são as que ela vê na tela cheia — troque à vontade.
 */
export const FESTA_DA_AGUA = {
  titulo: 'PARABÉNS, AMOR!',
  subtitulo: 'você bateu toda a água de hoje 💧',
  orgulho: 'você é o meu orgulho 🥺💗',
}

/** Frases pra quando ela continua bebendo depois da meta. */
export const AGUA_ALEM_DA_META = [
  'e ainda continuou bebendo 🥺💗',
  'passou da meta e não parou — orgulho demais',
  'isso aí, amor: água nunca é demais 💧',
  'a meta era o começo, né? 💗',
]

/** Comemorações. */
export const COMEMORACOES = {
  diaPerfeito: 'DIA PERFEITO 💗',
  bonusFeito: 'você foi além hoje, que orgulho 🥺💗',
  aguaBatida: 'meta batida! seu corpo agradece 💗',
  treinoComprovado: 'TREINO COMPROVADO ✅💗',
  beijinho: 'o Benjamin te mandou um beijinho 😘',
}

/** Sorteia uma frase de forma estável dentro da mesma sessão/dia. */
export function sortear<T>(lista: readonly T[], semente = Date.now()): T {
  return lista[Math.abs(Math.floor(semente)) % lista.length]
}

/** Semente estável a partir de uma data ISO, pra frase do dia não ficar trocando. */
export function sementeDaData(iso: string): number {
  return iso.split('-').reduce((acc, parte) => acc * 31 + Number(parte), 7)
}
