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

/** Cartinhas surpresa — abrem no dia 1, no dia 8 e no dia 15 do desafio. */
export type Cartinha = { indiceDoDia: number; titulo: string; texto: string }

export const CARTINHAS: Cartinha[] = [
  {
    indiceDoDia: 1,
    titulo: 'pro seu primeiro dia 💗',
    texto: `Isabela,

hoje é o dia 1 de uma coisa que você decidiu sozinha, e isso já me deixa orgulhoso antes mesmo de você começar.

Eu fiz esse cantinho aqui pra você não fazer isso sozinha. Todo dia que você marcar um quadradinho, eu vou estar vendo do meu celular e torcendo por você.

Não é sobre o número da balança. É sobre você provar pra você mesma que você faz o que decide fazer.

Vai com calma. Eu tô aqui.

te amo 💗`,
  },
  {
    indiceDoDia: 8,
    titulo: 'metade do caminho 🌸',
    texto: `Amor,

metade. Você já fez metade.

Sabe aquela semana que parecia que não ia passar? Passou — e você passou por ela treinando.

Se hoje tiver sido um dia difícil, tudo bem. Difícil não é motivo pra parar, é só um dia mais pesado que os outros.

Olha pra trás no calendário e vê tudo que você já pintou de rosa. Isso é seu.

Falta pouco. Segura firme 💗`,
  },
  {
    indiceDoDia: 15,
    titulo: 'você conseguiu 🏆',
    texto: `Isabela,

acabou. Você foi do começo ao fim.

Quinze dias atrás isso aqui era só uma ideia num papel, e agora é um calendário inteiro com a sua marca em cada dia.

Compara a foto do primeiro dia com a de hoje. Não é só o corpo — é o jeito que você olha pra câmera.

Eu sempre soube que você ia conseguir. Só queria estar do seu lado quando acontecesse.

Parabéns, meu amor. De verdade.

seu, Benjamin 💗`,
  },
]

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
