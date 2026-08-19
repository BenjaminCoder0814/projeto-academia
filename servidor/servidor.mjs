/**
 * Servidor do Projetinho — banco de dados SQLite, um arquivo só.
 *
 *   npm run servidor
 *
 * Guarda tudo em servidor/dados/projetinho.db (e as fotinhas em dados/fotos/).
 * Os dois celulares falam com ele pela rede de casa, então o que a Isabela marca
 * no celular dela aparece no do Benjamin.
 *
 * Sem dependência nenhuma: usa o SQLite que já vem no Node 22.
 */
import { DatabaseSync } from 'node:sqlite'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes, randomUUID } from 'node:crypto'
import { networkInterfaces } from 'node:os'

const RAIZ = dirname(fileURLToPath(import.meta.url))
const PASTA_DADOS = join(RAIZ, 'dados')
const PASTA_FOTOS = join(PASTA_DADOS, 'fotos')
const PORTA = Number(process.env.PORTA ?? 8787)

mkdirSync(PASTA_FOTOS, { recursive: true })

/* ------------------------------------------------------------------ */
/* Chave de acesso                                                     */
/* ------------------------------------------------------------------ */

const ARQUIVO_CHAVE = join(PASTA_DADOS, 'chave.txt')
if (!existsSync(ARQUIVO_CHAVE)) {
  writeFileSync(ARQUIVO_CHAVE, randomBytes(12).toString('hex'), 'utf8')
}
const CHAVE = (process.env.CHAVE ?? readFileSync(ARQUIVO_CHAVE, 'utf8')).trim()

/* ------------------------------------------------------------------ */
/* Banco                                                               */
/* ------------------------------------------------------------------ */

const db = new DatabaseSync(join(PASTA_DADOS, 'projetinho.db'))
db.exec('pragma journal_mode = WAL')
db.exec(`
  create table if not exists perfis (
    id text primary key,
    nome text not null,
    papel text not null check (papel in ('isabela','benjamin')),
    data_nascimento text,
    altura_cm real,
    peso_inicial_kg real,
    criado_em text default (datetime('now'))
  );

  create table if not exists pesos (
    user_id text not null,
    data text not null,
    peso_kg real not null,
    primary key (user_id, data)
  );

  create table if not exists dias (
    user_id text not null,
    data text not null,
    corrida_ok integer default 0,
    natacao_ok integer default 0,
    bonus_sexta_ok integer default 0,
    agua_ml integer default 0,
    agua_meta_ml integer not null,
    humor integer,
    calorias integer,
    fc_media integer,
    nota text,
    primary key (user_id, data)
  );

  create table if not exists fotos (
    id text primary key,
    user_id text not null,
    data text not null,
    tipo text not null check (tipo in ('evolucao','relogio','galeria')),
    arquivo text not null,
    criado_em text default (datetime('now'))
  );

  create unique index if not exists fotos_uma_por_tipo
    on fotos (user_id, data, tipo) where tipo in ('evolucao','relogio');

  create table if not exists recados (
    id text primary key,
    autor_id text not null,
    data text not null,
    texto text not null,
    lido integer default 0,
    criado_em text default (datetime('now'))
  );

  create table if not exists beijinhos (
    id text primary key,
    autor_id text not null,
    visto integer default 0,
    criado_em text default (datetime('now'))
  );
`)

const bool = (v) => (v ? 1 : 0)
const deBool = (v) => Boolean(v)

function perfilDe(papel) {
  return db.prepare('select * from perfis where papel = ?').get(papel) ?? null
}

function montarPerfil(linha) {
  if (!linha) return null
  return {
    id: linha.id,
    nome: linha.nome,
    papel: linha.papel,
    data_nascimento: linha.data_nascimento ?? null,
    altura_cm: linha.altura_cm ?? null,
    peso_inicial_kg: linha.peso_inicial_kg ?? null,
  }
}

function snapshot() {
  const isabela = montarPerfil(perfilDe('isabela'))
  if (!isabela) {
    return { perfilIsabela: null, dias: [], pesos: [], fotos: [], recados: [], beijinhos: [] }
  }
  const dias = db
    .prepare('select * from dias where user_id = ? order by data')
    .all(isabela.id)
    .map((d) => ({
      data: d.data,
      corrida_ok: deBool(d.corrida_ok),
      natacao_ok: deBool(d.natacao_ok),
      bonus_sexta_ok: deBool(d.bonus_sexta_ok),
      agua_ml: d.agua_ml ?? 0,
      agua_meta_ml: d.agua_meta_ml,
      humor: d.humor ?? null,
      calorias: d.calorias ?? null,
      fc_media: d.fc_media ?? null,
      nota: d.nota ?? null,
    }))

  const pesos = db
    .prepare('select data, peso_kg from pesos where user_id = ? order by data')
    .all(isabela.id)

  const fotos = db
    .prepare('select id, data, tipo, id as storage_path, criado_em from fotos where user_id = ? order by data')
    .all(isabela.id)

  const recados = db
    .prepare(
      `select r.id, r.autor_id, r.data, r.texto, r.lido, r.criado_em, p.nome as autor_nome
       from recados r left join perfis p on p.id = r.autor_id order by r.criado_em`,
    )
    .all()
    .map((r) => ({ ...r, lido: deBool(r.lido) }))

  const beijinhos = db
    .prepare('select id, autor_id, visto, criado_em from beijinhos order by criado_em desc limit 20')
    .all()
    .map((b) => ({ ...b, visto: deBool(b.visto) }))

  return { perfilIsabela: isabela, dias, pesos, fotos, recados, beijinhos }
}

/* ------------------------------------------------------------------ */
/* HTTP                                                                */
/* ------------------------------------------------------------------ */

function responder(res, status, corpo, tipo = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'content-type': tipo,
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, x-chave',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'cache-control': 'no-store',
  })
  res.end(tipo.startsWith('application/json') ? JSON.stringify(corpo) : corpo)
}

function corpoBruto(req) {
  return new Promise((ok, erro) => {
    const partes = []
    req.on('data', (p) => partes.push(p))
    req.on('end', () => ok(Buffer.concat(partes)))
    req.on('error', erro)
  })
}

async function corpoJson(req) {
  const bruto = await corpoBruto(req)
  return bruto.length ? JSON.parse(bruto.toString('utf8')) : {}
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const partes = url.pathname.split('/').filter(Boolean) // ['api', ...]

  if (req.method === 'OPTIONS') return responder(res, 204, '')

  // a chave pode vir no cabeçalho ou na query (as <img> não mandam cabeçalho)
  const chave = req.headers['x-chave'] ?? url.searchParams.get('chave')
  if (partes[0] !== 'api') return responder(res, 404, { erro: 'só existe /api aqui' })
  if (chave !== CHAVE) return responder(res, 401, { erro: 'chave inválida' })

  try {
    const [, recurso, a, b] = partes

    /* --- quem é você --- */
    if (recurso === 'entrar' && req.method === 'POST') {
      const { papel, nome } = await corpoJson(req)
      if (papel !== 'isabela' && papel !== 'benjamin') {
        return responder(res, 400, { erro: 'papel inválido' })
      }
      let perfil = perfilDe(papel)
      if (!perfil) {
        const id = papel // dois usuários só: o id é o próprio papel
        db.prepare(
          'insert into perfis (id, nome, papel, data_nascimento) values (?, ?, ?, ?)',
        ).run(id, nome || (papel === 'isabela' ? 'Isabela' : 'Benjamin'), papel, '2007-05-25')
        perfil = perfilDe(papel)
      } else if (nome && nome !== perfil.nome) {
        db.prepare('update perfis set nome = ? where id = ?').run(nome, perfil.id)
        perfil = perfilDe(papel)
      }
      return responder(res, 200, montarPerfil(perfil))
    }

    /* --- tudo de uma vez --- */
    if (recurso === 'tudo' && req.method === 'GET') {
      return responder(res, 200, snapshot())
    }

    /* --- perfil --- */
    if (recurso === 'perfil' && req.method === 'PATCH') {
      const patch = await corpoJson(req)
      const id = a
      const campos = ['nome', 'data_nascimento', 'altura_cm', 'peso_inicial_kg'].filter(
        (c) => patch[c] !== undefined,
      )
      if (campos.length) {
        db.prepare(
          `update perfis set ${campos.map((c) => `${c} = ?`).join(', ')} where id = ?`,
        ).run(...campos.map((c) => patch[c]), id)
      }
      return responder(res, 200, montarPerfil(db.prepare('select * from perfis where id = ?').get(id)))
    }

    /* --- dia --- */
    if (recurso === 'dias' && req.method === 'PUT') {
      const patch = await corpoJson(req)
      const isabela = perfilDe('isabela')
      if (!isabela) return responder(res, 400, { erro: 'a Isabela ainda não entrou' })
      const atual =
        db.prepare('select * from dias where user_id = ? and data = ?').get(isabela.id, a) ?? {}
      const novo = {
        corrida_ok: bool(patch.corrida_ok ?? deBool(atual.corrida_ok)),
        natacao_ok: bool(patch.natacao_ok ?? deBool(atual.natacao_ok)),
        bonus_sexta_ok: bool(patch.bonus_sexta_ok ?? deBool(atual.bonus_sexta_ok)),
        agua_ml: patch.agua_ml ?? atual.agua_ml ?? 0,
        agua_meta_ml: patch.agua_meta_ml ?? atual.agua_meta_ml ?? 2000,
        humor: patch.humor ?? atual.humor ?? null,
        calorias: patch.calorias ?? atual.calorias ?? null,
        fc_media: patch.fc_media ?? atual.fc_media ?? null,
        nota: patch.nota ?? atual.nota ?? null,
      }
      db.prepare(
        `insert into dias (user_id, data, corrida_ok, natacao_ok, bonus_sexta_ok, agua_ml,
                           agua_meta_ml, humor, calorias, fc_media, nota)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         on conflict (user_id, data) do update set
           corrida_ok = excluded.corrida_ok, natacao_ok = excluded.natacao_ok,
           bonus_sexta_ok = excluded.bonus_sexta_ok, agua_ml = excluded.agua_ml,
           agua_meta_ml = excluded.agua_meta_ml, humor = excluded.humor,
           calorias = excluded.calorias, fc_media = excluded.fc_media, nota = excluded.nota`,
      ).run(
        isabela.id, a, novo.corrida_ok, novo.natacao_ok, novo.bonus_sexta_ok, novo.agua_ml,
        novo.agua_meta_ml, novo.humor, novo.calorias, novo.fc_media, novo.nota,
      )
      return responder(res, 200, { ok: true })
    }

    /* --- peso --- */
    if (recurso === 'pesos' && req.method === 'PUT') {
      const { peso_kg } = await corpoJson(req)
      const isabela = perfilDe('isabela')
      if (!isabela) return responder(res, 400, { erro: 'a Isabela ainda não entrou' })
      db.prepare(
        `insert into pesos (user_id, data, peso_kg) values (?, ?, ?)
         on conflict (user_id, data) do update set peso_kg = excluded.peso_kg`,
      ).run(isabela.id, a, peso_kg)
      return responder(res, 200, { ok: true })
    }

    /* --- fotinhas --- */
    if (recurso === 'fotos' && req.method === 'POST') {
      const isabela = perfilDe('isabela')
      if (!isabela) return responder(res, 400, { erro: 'a Isabela ainda não entrou' })
      const [, , data, tipo] = partes
      const bytes = await corpoBruto(req)
      if (!bytes.length) return responder(res, 400, { erro: 'foto vazia' })

      // a galeria aceita quantas ela quiser; as outras duas são uma por dia
      const anterior =
        tipo === 'galeria'
          ? null
          : db
              .prepare('select id from fotos where user_id = ? and data = ? and tipo = ?')
              .get(isabela.id, data, tipo)
      const id = anterior?.id ?? randomUUID()
      const arquivo = `${id}.jpg`
      writeFileSync(join(PASTA_FOTOS, arquivo), bytes)
      db.prepare(
        `insert into fotos (id, user_id, data, tipo, arquivo, criado_em)
         values (?, ?, ?, ?, ?, datetime('now'))
         on conflict (id) do update set
           arquivo = excluded.arquivo, criado_em = excluded.criado_em`,
      ).run(id, isabela.id, data, tipo, arquivo)
      return responder(res, 200, {
        id,
        data,
        tipo,
        storage_path: id,
        criado_em: new Date().toISOString(),
      })
    }

    if (recurso === 'fotos' && req.method === 'GET') {
      const linha = db.prepare('select arquivo from fotos where id = ?').get(a)
      if (!linha) return responder(res, 404, { erro: 'foto não encontrada' })
      const caminho = join(PASTA_FOTOS, linha.arquivo)
      if (!existsSync(caminho)) return responder(res, 404, { erro: 'arquivo sumiu' })
      res.writeHead(200, {
        'content-type': 'image/jpeg',
        'access-control-allow-origin': '*',
        'cache-control': 'private, max-age=60',
      })
      return res.end(readFileSync(caminho))
    }

    if (recurso === 'fotos' && req.method === 'DELETE') {
      const linha = db.prepare('select arquivo from fotos where id = ?').get(a)
      if (linha) {
        db.prepare('delete from fotos where id = ?').run(a)
        const caminho = join(PASTA_FOTOS, linha.arquivo)
        if (existsSync(caminho)) rmSync(caminho, { force: true })
      }
      return responder(res, 200, { ok: true })
    }

    /* --- recadinhos --- */
    if (recurso === 'recados' && req.method === 'POST') {
      const { autor_id, data, texto } = await corpoJson(req)
      const id = randomUUID()
      db.prepare(
        `insert into recados (id, autor_id, data, texto, criado_em)
         values (?, ?, ?, ?, datetime('now'))`,
      ).run(id, autor_id, data, texto)
      return responder(res, 200, { id })
    }

    if (recurso === 'recados' && req.method === 'PATCH' && b === 'lido') {
      db.prepare('update recados set lido = 1 where id = ?').run(a)
      return responder(res, 200, { ok: true })
    }

    /* --- beijinhos --- */
    if (recurso === 'beijinhos' && req.method === 'POST') {
      const { autor_id } = await corpoJson(req)
      db.prepare(
        "insert into beijinhos (id, autor_id, criado_em) values (?, ?, datetime('now'))",
      ).run(randomUUID(), autor_id)
      return responder(res, 200, { ok: true })
    }

    if (recurso === 'beijinhos' && req.method === 'PATCH') {
      const { ids } = await corpoJson(req)
      const marca = db.prepare('update beijinhos set visto = 1 where id = ?')
      for (const id of ids ?? []) marca.run(id)
      return responder(res, 200, { ok: true })
    }

    return responder(res, 404, { erro: 'não existe essa rota' })
  } catch (e) {
    console.error(e)
    return responder(res, 500, { erro: String(e?.message ?? e) })
  }
})

servidor.listen(PORTA, '0.0.0.0', () => {
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address)

  console.log('')
  console.log('  💗 Banco do Projetinho no ar')
  console.log(`     arquivo: ${join(PASTA_DADOS, 'projetinho.db')}`)
  console.log(`     fotinhas: ${PASTA_FOTOS}`)
  console.log('')
  console.log('  Cole isto no .env da raiz do projeto:')
  console.log('')
  for (const ip of ips) console.log(`     VITE_API_URL=http://${ip}:${PORTA}`)
  console.log(`     VITE_API_CHAVE=${CHAVE}`)
  console.log('')
})
