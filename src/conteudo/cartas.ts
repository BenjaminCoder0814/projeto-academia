/* =====================================================================
 * AS CARTINHAS DE CADA DIA
 *
 * Benjamin: uma por dia do desafio, e cada uma só abre no dia dela, a
 * partir das 14:00 — a hora em que ela vai treinar. Troque os textos por
 * palavras suas, é só texto. O `dia` é o número do dia do desafio (1 a 15).
 * ===================================================================== */

export type CartaDoDia = {
  dia: number
  titulo: string
  texto: string
}

/** A partir de que horas de Brasília a carta do dia abre. */
export const HORA_QUE_ABRE = 14

export const CARTAS_DO_DIA: CartaDoDia[] = [
  {
    dia: 1,
    titulo: 'o primeiro passo 💗',
    texto: `Isabela,

hoje é o dia 1 de uma coisa que você decidiu sozinha, e isso já me deixa orgulhoso antes mesmo de você começar.

Eu fiz esse cantinho aqui pra você não fazer isso sozinha. Todo dia que você marcar um quadradinho, eu vou estar do outro lado, vendo e torcendo.

Não é sobre o número da balança. É sobre você provar pra você mesma que você faz o que decide fazer.

Vai com calma. Eu tô aqui.

te amo 💗`,
  },
  {
    dia: 2,
    titulo: 'o segundo é mais difícil que o primeiro',
    texto: `Amor,

o dia 1 todo mundo faz. O dia 2 é que separa quem quer de quem vai.

E você tá aqui, abrindo essa carta, o que quer dizer que você veio.

Me orgulha de um jeito que eu não sei explicar direito. Não é o treino em si — é você levantando e indo, mesmo quando seria tão mais fácil não ir.

vai lá, minha linda. te amo 💗`,
  },
  {
    dia: 3,
    titulo: 'olha só quem tá aqui 🥺',
    texto: `Três dias seguidos, Isabela.

Sabe quantas pessoas param no terceiro? Muitas. E você aí, de tênis, pronta.

Hoje tem natação também. Quando a água bater na sua cara e você pensar "que preguiça", lembra que eu tô te achando incrível daqui.

Você me dá orgulho todo santo dia.

te amo demais 💗`,
  },
  {
    dia: 4,
    titulo: 'hoje é bônus — e tá tudo bem ⭐',
    texto: `Amor,

hoje é sexta. Se você for correr, ganha estrelinha e eu vou ficar besta de orgulho.

Se você não for, também tá tudo certo. De verdade. Descansar é parte de treinar, e eu não te amo por causa de quadradinho pintado.

Você já fez três dias inteiros. Isso é seu, ninguém tira.

seja como for hoje, eu te amo do mesmo tamanho 💗`,
  },
  {
    dia: 5,
    titulo: 'folga merecida ❤️',
    texto: `Isabela,

hoje não tem nada pra fazer. Sério. Deita, dorme até tarde, come alguma coisa gostosa.

Seu corpo tá construindo o resultado agora, enquanto você descansa. É assim que funciona.

Só bebe sua água e, se der vontade, tira a fotinha. Sem cobrança nenhuma.

Você merece esse dia. te amo 🥺💗`,
  },
  {
    dia: 6,
    titulo: 'domingo é seu 🌸',
    texto: `Amor,

primeira semana quase fechada. Olha o calendário e vê tudo que você já pintou.

Amanhã a gente volta, mas hoje é seu. Descansa sem culpa.

Eu queria que você se enxergasse do jeito que eu te enxergo: teimosa do jeito certo, bonita demais, e muito mais forte do que você acha que é.

te amo, minha vida 💗`,
  },
  {
    dia: 7,
    titulo: 'segunda-feira, começo de novo 💪',
    texto: `Isabela,

semana nova. Hoje é só a corrida, sem natação — 40 minutinhos e o dia tá feito.

Segunda é o dia mais fácil de arrumar desculpa. Por isso ir hoje vale o dobro.

Vai lá e me deixa orgulhoso de novo. Você já vem fazendo isso há uma semana inteira.

te amo 💗`,
  },
  {
    dia: 8,
    titulo: 'metade do caminho 🌸',
    texto: `Amor,

metade. Você já fez metade.

Sabe aquela semana que parecia que não ia passar? Passou — e você passou por ela treinando.

Se hoje for um dia difícil, tudo bem. Difícil não é motivo pra parar, é só um dia mais pesado que os outros.

Olha pra trás no calendário e vê o tanto de rosa que tem lá. Isso é você.

Falta pouco. Segura firme, que eu tô do seu lado 💗`,
  },
  {
    dia: 9,
    titulo: 'ninguém tá vendo, e é isso que conta',
    texto: `Isabela,

tem dia que a gente treina e ninguém aplaude. Hoje pode ser um desses.

Mas eu tô vendo. Cada quadradinho que você marca aqui aparece no meu celular, e eu fico bobo toda vez.

Você não tá fazendo isso por mim, e é exatamente por isso que me orgulha tanto.

te amo, viu? 💗`,
  },
  {
    dia: 10,
    titulo: 'dez de quinze 🔥',
    texto: `Dez dias, amor.

Faltam cinco. Cinco.

Você já passou da parte difícil, aquela em que o corpo reclama e a cabeça inventa motivo. Agora é só continuar sendo você.

Eu te amo e tenho muito orgulho de você. Não é frase feita — é o que eu penso quando vejo o calendário enchendo.

vai lá 💗`,
  },
  {
    dia: 11,
    titulo: 'outra sexta, outro bônus ⭐',
    texto: `Amor,

de novo: hoje é opcional. Se der vontade, vai; se não der, deita.

Você chegou até aqui sem precisar de ninguém te empurrando. Isso diz muito mais sobre você do que qualquer treino de sexta.

Do jeito que for, meu orgulho é o mesmo.

te amo 💗`,
  },
  {
    dia: 12,
    titulo: 'descansa, minha linda 💤',
    texto: `Isabela,

penúltimo fim de semana do desafio. Aproveita ele inteiro.

Se cuida hoje: dorme bem, bebe sua água, come direitinho. Segunda a gente fecha essa reta final junto.

Obrigado por ter levado isso a sério. Eu sei que não foi fácil.

te amo demais 🥺💗`,
  },
  {
    dia: 13,
    titulo: 'reta final começa amanhã 🌸',
    texto: `Amor,

faltam três dias. Três.

Lembra do dia 1, quando isso aqui parecia longe? Você atravessou quase tudo.

Hoje descansa. Amanhã a gente termina do jeito que você começou: fazendo o que decidiu fazer.

Você é o meu orgulho, Isabela. Sempre foi.

te amo 💗`,
  },
  {
    dia: 14,
    titulo: 'penúltimo dia 💗',
    texto: `Isabela,

falta um depois de hoje.

Eu queria estar aí pra ver sua cara quando você terminar o último. Como não dá, deixei tudo escrito aqui.

Hoje é só corrida. Vai lá, faz o que você já sabe fazer, e volta pra casa sabendo que faltou só um.

Que orgulho de você, amor. De verdade.

te amo 💗`,
  },
  {
    dia: 15,
    titulo: 'você conseguiu 🏆',
    texto: `Isabela,

acabou. Você foi do começo ao fim.

Quinze dias atrás isso aqui era uma ideia num papel, e hoje é um calendário inteiro com a sua marca em cada dia.

Compara a foto do primeiro dia com a de hoje. Não é só o corpo — é o jeito que você olha pra câmera.

Eu sempre soube que você ia conseguir. Só queria estar do seu lado quando acontecesse.

Parabéns, meu amor. Você é o meu maior orgulho.

seu, Benjamin 💗`,
  },
]

/**
 * O abraço de fim de dia: aparece quando ela toca em "Concluir o dia".
 * São quatro versões pra não ficar repetitivo — ela vai ver isso 15 vezes.
 */
export const FECHOU_O_DIA = [
  {
    titulo: 'acabou por hoje, amor 💗',
    texto: `Você fez a sua parte. Pode largar tudo agora, deitar e não pensar em mais nada.

Eu sei o tamanho do esforço que tem por trás de cada quadradinho desse — e você fez mesmo nos dias em que não deu vontade.

Você é a pessoa mais importante da minha vida, e hoje você me deu mais um motivo de orgulho.

Descansa. Eu te amo demais 🥺💗`,
  },
  {
    titulo: 'pronto, dia fechado 🌸',
    texto: `Agora relaxa. Sério, você merece.

Tem gente que promete e não faz. Você promete pra você mesma e cumpre — e isso é uma das coisas mais bonitas que existem em você.

Você é especial de um jeito que eu não sei explicar. Só sei que tenho sorte.

Te amo, minha linda. Descansa 💗`,
  },
  {
    titulo: 'que orgulho de você 🥺',
    texto: `Terminou. Pode respirar.

Hoje você cuidou de você, e isso é a coisa mais importante que você podia ter feito.

Não é sobre peso, nem sobre número nenhum: é sobre você se escolher todo dia. E você escolheu de novo.

Você é tudo pra mim. Te amo 💗`,
  },
  {
    titulo: 'missão cumprida, meu amor 💗',
    texto: `Larga o celular, toma um banho gostoso e descansa. O dia tá fechado.

Você é forte, é linda e é teimosa do jeito certo — e eu me apaixono um pouquinho mais a cada dia desses que você fecha.

Obrigado por deixar eu acompanhar isso com você.

Te amo muito 🥺💗`,
  },
]

/** Frases de agradecimento quando ela sobe mais de uma fotinha no dia. */
export const OBRIGADO_PELAS_FOTOS = [
  'obrigado pelas fotinhas, amor 🥺💗',
  'amei cada uma, viu? obrigado 💗',
  'você mandando foto é a melhor parte do meu dia 🥺',
  'obrigado por me deixar acompanhar de pertinho 💗',
]

/**
 * A frase de incentivo que aparece na aba do prêmio — uma por dia,
 * escolhida pela data, então todo dia é uma diferente.
 */
export const MOTIVACIONAIS = [
  'cada dia desses é um pedacinho do seu lookinho novo 🎽',
  'você não tá treinando por mim, e é por isso que eu me orgulho tanto 💗',
  'a Isabela de daqui a um mês tá torcendo pela de hoje 🥺',
  'olha a porcentagem subindo — isso aí é você, inteirinha',
  'disciplina é amor próprio em forma de rotina, amor 💗',
  'o difícil já passou: agora é só não soltar a mão 🤍',
  'ninguém precisa ver pra valer. mas eu tô vendo, e tô babando',
  'seu corpo agradece, e eu agradeço junto 🥰',
  'você é a prova de que decisão vale mais que vontade 💪',
  'mais um dia perto do prêmio, e mais um motivo de orgulho pra mim',
  'não precisa ser perfeito, precisa ser hoje 💗',
  'a sua teimosia é linda quando é a favor de você',
  'se hoje tá difícil, faz do jeito difícil mesmo. depois eu te abraço 🥺',
  'você já chegou mais longe do que a maioria chega — segue',
  'te amo, e tenho orgulho de você todo santo dia 💗',
]

/** Quando ela fecha o dia sem nenhuma fotinha. Tristinho, nunca bravo. */
export const DIA_SEM_FOTO = {
  titulo: 'esse dia foi sem foto 🥺',
  texto: `Fica um buraquinho no álbum da gente bem no dia de hoje.

Não é cobrança, amor — é saudade adiantada. Eu gosto de ver como você tava em cada dia desse.

Se ainda der tempo hoje, manda uma pra mim? 💗`,
}

/** Quando ela manda só uma fotinha do dia — birra carinhosa, nunca cobrança. */
export const SO_UMA_FOTINHA = [
  'poxa, só uma? 🥺 seu amor aqui merece mais fotinhas suas 💗',
  'uma só, amor? eu queria ver uns dez ângulos seus 🥺',
  'aceito, mas fica devendo — manda mais uma pra mim 💗',
  'só uma fotinha? 🥺 tá bom… mas amanhã quero mais',
]

/**
 * As broncas fofas das refeições. Nunca bravas de verdade — é ciúme de
 * quem quer ver ela comendo direito.
 */
export const BRONCAS = {
  semCafe: [
    'ê, moça… almoçando e o café da manhã? 🥺 come direito, vai',
    'peraí: pulou o café da manhã de novo? não vale 🥺💗',
    'você sabe que eu ia perguntar isso: cadê o café da manhã? 💗',
  ],
  semAlmoco: [
    'janta sem almoço, amor? 🥺 assim você me preocupa',
    'e o almoço, sumiu? come direitinho pra mim 💗',
    'não pode pular refeição, minha linda 🥺 amanhã eu quero ver as três',
  ],
  cafeAtrasado: [
    'já passou das 10h e nada de café da manhã 🥺 come alguma coisa, vai',
    'bom dia, amor! seu café da manhã tá me devendo uma fotinha ☕💗',
  ],
  tudoCerto: [
    'as três refeições no capricho hoje 🥰 assim que se faz',
    'comeu direitinho hoje — é isso que eu queria ver 💗',
  ],
}

/** Elogios de quando ela fecha o dia inteirinho. */
export const ELOGIOS_DO_DIA_COMPLETO = [
  'você fez tudo hoje. TUDO. que orgulho 🥺💗',
  'dia fechado do jeito certo — você é incrível',
  'nem um item faltando. eu tô muito orgulhoso de você 💗',
  'olha o tamanho da sua disciplina, amor 🏆',
]
