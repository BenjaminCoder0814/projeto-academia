# 💗 Projetinho de Benjamin pra Isabela

Um calendário rosa e fofinho, feito pro celular, onde a Isabela acompanha dia a dia o desafio de
**18/08/2026 a 01/09/2026** — e o Benjamin acompanha tudo do celular dele, torcendo por ela.

React 18 + Vite + TypeScript + Tailwind + Framer Motion, com Supabase (Auth + Postgres + Storage
privado) e deploy na Netlify.

---

## 1. Rodar na sua máquina

```bash
npm install
npm run dev          # http://localhost:5173
```

Sem as variáveis do Supabase o app entra em **modo local**: tudo é gravado num banco de dados do
próprio aparelho (IndexedDB) — sobrevive a fechar o app, desligar o celular e ficar sem internet.
O que falta nesse modo é só o compartilhamento: o Benjamin não enxerga do celular dele. Na aba
**💗 Nós** existe o cartão *Onde tudo fica guardado*, com quanto está gravado, o pedido de
armazenamento permanente e os botões de **backup** e **restaurar** (um arquivo só, com as fotinhas
dentro).

```bash
npm test             # 47 asserções: regras de cálculo + comportamento do bônus e da folguinha
npm run build        # gera dist/
npm run preview      # serve o dist/ localmente
npm run icons        # regenera os ícones do PWA
npm run servidor     # sobe o banco SQLite local (ver seção 9)
```

## 2. Supabase — já está configurado ✅

O projeto **academia-amor** está no ar com o schema aplicado,
RLS ligado, bucket privado e login por e-mail sem confirmação. A URL e a chave ficam no `.env`
da raiz, que **não** vai pro repositório — use o `.env.example` como modelo.

Se um dia precisar refazer num projeto novo, o passo a passo é este:

### Do zero (~30 min)

1. Crie um projeto grátis em <https://supabase.com>.
2. **SQL Editor** → cole e rode o [`supabase/schema.sql`](supabase/schema.sql) inteiro, uma vez.
   Ele cria as tabelas, o gatilho de perfil, todas as políticas de RLS, o bucket **privado** `fotos`,
   a tabela dos beijinhos e liga o tempo real.
3. **Project Settings → API** → copie a `Project URL` e a chave `anon public`.
4. Crie um `.env` na raiz (copie de `.env.example`):

   ```
   VITE_SUPABASE_URL=https://seuprojeto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

   **Nunca** coloque a chave `service_role` no front nem no repositório.
5. **Authentication → Providers → Email** ligado. Pra não precisar confirmar e-mail nos testes,
   desligue *Confirm email* enquanto vocês criam as duas contas.
6. Abra o app e crie as **duas contas**: a dela como **“Sou a Isabela 💪”** e a dele como
   **“Sou o Benjamin 💗”**.
7. **Feche o cadastro depois disso**: em *Authentication → Sign In / Providers*, desative
   **Allow new users to sign up**. É o que garante que só vocês dois entram — as políticas dão
   leitura dos dados dela a quem tem o papel `benjamin`.

### O que as políticas garantem

- A Isabela escreve só nos registros dela; o Benjamin **não marca nada por ela** — só lê, manda
  recadinho e beijinho.
- O bucket `fotos` é privado: as fotinhas só abrem por URL assinada válida por 1 hora.
- Cada foto vai pra pasta `"<id-da-Isabela>/…"`, e a política do Storage confere isso.

## 3. Deploy na Netlify

1. Suba pro GitHub e conecte o repositório na Netlify (ou use `netlify deploy`).
2. O [`netlify.toml`](netlify.toml) já traz build `npm run build`, publish `dist` e o redirect de SPA.
3. **Site settings → Environment variables**: cadastre `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` e **refaça o deploy** (as variáveis entram no bundle na hora do build).
4. Abra no celular e use **Adicionar à Tela de Início** pra instalar como app.

## 4. Onde ficam os textos carinhosos

Tudo que o app fala com ela está em **[`src/conteudo/mensagens.ts`](src/conteudo/mensagens.ts)** —
é só texto, edite à vontade:

- `RECADINHOS_DO_TOPO` — a linha que troca a cada abertura, embaixo do cabeçalho.
- `FRASES_DO_DIA` — a frase que abre a tela do dia (uma lista por tipo de dia).
- `CARTINHAS` — **as cartinhas surpresa dos dias 1, 8 e 15**. As três já estão escritas; troque
  pelas suas palavras antes de mostrar pra ela.
- `CARTA_FINAL` — a carta que abre no dia 01/09.
- `TIMER` e `COMEMORACOES` — as falas do cronômetro e das comemorações.

## 5. As regras (e onde elas moram)

Tudo em [`src/lib/calculos.ts`](src/lib/calculos.ts), coberto por
[`src/lib/calculos.test.ts`](src/lib/calculos.test.ts).

| Dia | O que tem | Como aparece |
|---|---|---|
| Segunda | corrida 40 min | 💗 rosa |
| Terça, quarta, quinta | corrida 40 min + natação 45 min | 💗🏊 rosa |
| Sexta | corrida **bônus**, opcional | ⭐ lilás pontilhado (dourado se ela for) |
| Sábado, domingo | nada | ❤️ vermelhinho com 💤 |

- **Idade**: calculada de `2007-05-25` a cada abertura — nunca fixa. Em 18/08/2026 dá 19.
- **Água**: `35 ml × peso + 600 ml por hora de treino`, arredondado pra 50 ml, entre 2,0 L e 4,0 L.
  Ter/qua/qui `+850 ml`, segunda `+400 ml`, sexta `+400 ml` **só se ela marcar o bônus**, fim de
  semana só a base.
- **Peso**: faixa saudável da OMS (IMC 18,5–24,9), metinha no IMC 22 e a média das quatro fórmulas
  clássicas em “ver as fórmulas”.
- **Sexta nunca cobra**: não fica cinza, não quebra a sequência, não conta como falha e **fica de
  fora do denominador da aderência** — se ela cumprir a semana e pular a sexta, as barrinhas
  mostram 100%, não 78%. Só soma estrelinha quando ela vai.
- **Folguinha caprichada**: sábado e domingo não pedem nada, mas se ela tirar a fotinha e bater a
  água o dia ganha coraçãozinho e conta como dia perfeito.
- **Sequência**: sexta, sábado e domingo nunca quebram.
- **Fotinhas de dia livre** aparecem como “+2 fotinhas tiradas em dia livre 💗”: somam, nunca cobram.

Dois detalhes de implementação que vale registrar:

1. **Arredondamento da água** — a tabela de conferência do briefing só fecha linha por linha com
   arredondamento *para o múltiplo par* nos empates (65 kg em dia completo = 3125 ml → 3100 ml, mas
   75 kg = 3475 ml → 3500 ml). É o critério implementado, com teste pra cada uma das 24 linhas.
2. **Fórmulas de peso abaixo de 1,524 m** — o texto pede pra zerar as polegadas negativas, mas a
   própria tabela dele (1,50 m → 46,5 kg) foi calculada *sem* zerar. Seguimos a tabela, que também é
   o resultado coerente: zerando, toda altura abaixo de 1,52 m daria o mesmo número.

## 6. O cronômetro da corrida

20 ciclos de 1 minuto caminhando + 1 minuto correndo = 40 minutos.

- Conta por **timestamp real** (`Date.now`), não por soma de ticks: continua certo com a tela
  apagada, o app em segundo plano ou depois de recarregar a página.
- Pede **Wake Lock** quando o navegador tem.
- Bipe + vibração 3 segundos antes de cada troca e na troca; ao terminar, marca a corrida (ou o
  bônus da sexta) sozinho.
- O estado fica salvo — fechar o app sem querer no meio do treino não perde o progresso.
- Encerrar pede confirmação fofinha antes.

## 7. Fotinhas

- Comprimidas no próprio celular antes de subir: no máximo 1440 px no maior lado, JPEG 0,82, com a
  orientação EXIF já aplicada (verificado: 3000×4000 / 1,4 MB → 1080×1440 / 275 KB).
- A foto do dia usa uma **câmera dentro do app**, com silhueta-guia e a foto do dia anterior como
  sombrinha a 25% — é isso que deixa o antes e depois alinhado. Se a câmera não abrir, o botão da
  galeria continua funcionando.
- Aparecem em moldura Polaroid com a data escrita à mão, no **Modo Fotos** do calendário e no mural
  da aba Evolução.
- Trocar a foto do dia apaga o arquivo antigo do bucket; dias anteriores nunca são apagados.

## 8. As coisinhas de namorado

- **Recadinho**: chega como envelope fechado no dia; ela toca, ele abre e solta coraçõezinhos.
- **Cartinhas surpresa**: dias 1, 8 e 15, em papel pautado com letra manuscrita.
- **Mandar beijinho 😘**: cai chuva de coração no celular do outro (e um avisinho na tela).
- **Modo Fotos**: o calendário inteiro vira mural das fotinhas dela.
- **Tela final de 01/09**: troféu, confete, antes e depois lado a lado, os números do desafio e a
  carta do Benjamin.

## 9. Onde os dados ficam — três modos

O app escolhe sozinho, nesta ordem, pelo que estiver no `.env`:

| Modo | Onde grava | Quem vê | Precisa de |
|---|---|---|---|
| **Nuvem** | Supabase: Postgres + Storage privado | os dois celulares, em qualquer lugar | conta grátis no Supabase |
| **Servidor de casa** | SQLite: `servidor/dados/projetinho.db` | os dois celulares, no mesmo Wi-Fi | `npm run servidor` |
| **Aparelho** | IndexedDB do celular | só quem está com o celular | nada |

### Servidor de casa (SQLite, sem conta em lugar nenhum)

```bash
npm run servidor        # sobe o banco na porta 8787 e imprime o .env pra colar
npm run dev -- --host   # o app, na mesma rede
```

O servidor cria `servidor/dados/projetinho.db` (o banco inteiro num arquivo só),
`servidor/dados/fotos/` (as fotinhas) e `servidor/dados/chave.txt` (a chave de acesso — quem não
mandar a chave leva 401). Não precisa de senha: cada celular escolhe uma vez **quem é você**, e o
app pergunta ao servidor a cada 5 segundos se tem novidade.

Backup desse modo é copiar a pasta `servidor/dados`. Ela está no `.gitignore` — o banco, as
fotinhas e a chave nunca vão pro repositório.

Limite honesto: só funciona com o computador ligado e os dois celulares no mesmo Wi-Fi. Pra ela
marcar o treino na academia e você ver do trabalho, é o Supabase — ou subir esse mesmo servidor
num host (ele é um arquivo Node sem dependência nenhuma).

No modo local o app pede `navigator.storage.persist()` pra o navegador não apagar nada quando o
celular ficar sem espaço — no iPhone isso costuma valer depois de **Adicionar à Tela de Início**.
Dados de uma versão anterior guardados em `localStorage` são migrados sozinhos na primeira
abertura, então nada do que ela já registrou se perde.

**Backup:** aba *Nós* → *Salvar backup de tudo 💾*. Gera um `.json` com tudo, fotinhas incluídas
(em base64), pra guardar no Drive ou levar pra outro celular pelo *Restaurar de um backup*.
Testado ponta a ponta: fechar o navegador inteiro e reabrir mantém tudo, e restaurar num aparelho
zerado traz dias, anotações e fotos de volta.

## 10. Offline

- A casca do app fica em cache por Service Worker, então ele abre sem internet.
- Checks, água e peso registrados offline entram numa fila local e sobem sozinhos quando a conexão
  volta (a fonte de verdade continua sendo o Postgres).
- **Envio de foto não é enfileirado**: sem internet o cartão mostra o erro e o botão *Tentar de novo*.

## 11. Como está medido

| Verificação | Resultado |
|---|---|
| `npm test` | 47 asserções passando |
| Lighthouse mobile | Performance **99** · Acessibilidade **100** · Boas práticas **100** |
| Scroll horizontal em 360, 390 e 430 px | nenhum |
| Passeio completo no navegador (onboarding → calendário → dia → treino → evolução → nós → final) | sem erro de console |

## 12. Estrutura

```
src/
  conteudo/     todos os textos carinhosos (mensagens.ts)
  lib/          regras puras (cálculos, datas, desafio, derivados, timer, imagem, confete)
  data/         repositórios (Supabase, servidor e aparelho), banco local, backup, fila, estado
servidor/       servidor.mjs — API + banco SQLite, sem dependências
  components/   cabeçalho, calendário, tela do dia, água, fotos, câmera, envelope, comparador
  screens/      Splash, Entrar, Onboarding, Calendário, Treino, Evolução, Nós, Final
supabase/       schema.sql (tabelas + RLS + storage + realtime)
scripts/        gerador dos ícones do PWA
```

## 13. Sobre as cores

A paleta do briefing ficou inteira, com dois ajustes de legibilidade:

- `--cinza` foi de `#9C8A96` para `#76626F` (o original dava 3,03 de contraste no fundo rosa).
- O rosa `--rosa-500 #FF4D8D` continua sendo a identidade — só que em **texto pequeno** ele dá 3,14.
  Nesses lugares o app usa `--magenta-texto #C90F68`, que é o mesmo tom um tico mais fechado e
  passa em AA em todos os fundos do app (o `#E8107A` puro fica em 4,39, logo abaixo dos 4,5 exigidos).
  Títulos grandes, botões e números continuam no rosa de sempre.

## 14. Aviso

Feito com amor pelo Benjamin 💗 — Este app é só um acompanhamento pessoal e **não substitui**
orientação de educador físico, nutricionista ou médico. As metas de peso e de água são estimativas
gerais.
