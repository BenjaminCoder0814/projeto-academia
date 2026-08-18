import { motion } from 'framer-motion'
import { ChevronRight, LogOut, Send } from 'lucide-react'
import { useState } from 'react'
import { CARTINHAS } from '../conteudo/mensagens'
import { Armazenamento } from '../components/Armazenamento'
import { CartinhaAberta, EnvelopeRecado } from '../components/Envelope'
import { SeletorRolagem } from '../components/SeletorRolagem'
import { Botao, Campo, Cartao, Etiqueta, Folhinha, Tela } from '../components/ui'
import { useEstado } from '../data/estado'
import {
  calcularIMC,
  classificarIMC,
  faixaSaudavel,
  formulasPesoIdeal,
  idadeDaIsabela,
  litros,
  metaDePeso,
  umaCasa,
} from '../lib/calculos'
import { chuvaDeCoracoes } from '../lib/confete'
import { dataPorExtenso } from '../lib/datas'
import { pesoEm } from '../lib/derivados'
import { diasDoDesafio } from '../lib/fase'
import { vibrar } from '../lib/feedback'

export function Nos() {
  const {
    perfil,
    snap,
    hoje,
    souIsabela,
    salvarPerfil,
    salvarPeso,
    metaAguaDe,
    enviarRecado,
    marcarRecadoLido,
    mandarBeijinho,
    sair,
  } = useEstado()

  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [cartinhaAberta, setCartinhaAberta] = useState<number | null>(null)
  const [folha, setFolha] = useState<'nome' | 'altura' | 'peso' | 'formulas' | null>(null)
  const [nome, setNome] = useState(perfil?.nome ?? '')
  const [novaAltura, setNovaAltura] = useState(snap.perfilIsabela?.altura_cm ?? 165)
  const [novoPeso, setNovoPeso] = useState('')

  const altura = snap.perfilIsabela?.altura_cm ?? 165
  const peso = pesoEm(snap, hoje) ?? snap.perfilIsabela?.peso_inicial_kg ?? 0
  const imc = peso ? calcularIMC(peso, altura) : 0
  const classe = classificarIMC(imc)
  const faixa = faixaSaudavel(altura)
  const meta = metaDePeso(altura)
  const f = formulasPesoIdeal(altura)

  const indiceDeHoje = diasDoDesafio().find((d) => d.data === hoje)?.indice ?? 0
  const cartinhasLiberadas = CARTINHAS.filter((c) => c.indiceDoDia <= Math.max(indiceDeHoje, 0))
  const recados = [...snap.recados].reverse().slice(0, 12)

  async function mandarRecado() {
    if (!texto.trim()) return
    setEnviando(true)
    try {
      await enviarRecado(hoje, texto.trim())
      setTexto('')
      setEnviado(true)
      vibrar(60)
      setTimeout(() => setEnviado(false), 2600)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Tela>
      <h1 className="px-1 font-manuscrita text-2xl text-rosa-500">nós dois 💗</h1>

      {/* beijinho */}
      <Cartao className="text-center">
        <p className="text-4xl">😘</p>
        <p className="font-bilhete mt-1 text-xl text-carvao/70">
          {souIsabela
            ? 'manda um beijinho pro Benjamin — cai uma chuva de coração no celular dele'
            : 'aperta aqui e cai uma chuva de coração no celular dela'}
        </p>
        <Botao
          className="mt-3 w-full"
          onClick={async () => {
            vibrar([40, 60, 40])
            chuvaDeCoracoes(50)
            await mandarBeijinho()
          }}
        >
          mandar beijinho 😘
        </Botao>
      </Cartao>

      {/* recadinho */}
      <Cartao>
        <h2 className="mb-2 font-display text-base font-bold">
          {souIsabela ? '💌 Mandar um recadinho' : '💌 Recadinho do dia'}
        </h2>
        <p className="mb-2 text-xs text-cinza first-letter:uppercase">{dataPorExtenso(hoje)}</p>
        <textarea
          value={texto}
          rows={3}
          maxLength={280}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={souIsabela ? 'escreve algo pra ele 💗' : 'manda uma força pra ela…'}
          className="w-full resize-none rounded-2xl border border-rosa-200 bg-white p-3 text-[15px] outline-none focus:border-rosa-400"
        />
        <Botao
          className="mt-2 flex w-full items-center justify-center gap-2"
          onClick={mandarRecado}
          desabilitado={enviando || !texto.trim()}
        >
          <Send size={16} /> {enviando ? 'enviando…' : 'Enviar recadinho'}
        </Botao>
        {enviado && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-bilhete mt-2 text-center text-xl text-rosa-500"
          >
            entregue no envelope 💌
          </motion.p>
        )}
      </Cartao>

      {/* cartinhas surpresa */}
      {cartinhasLiberadas.length > 0 && (
        <Cartao>
          <h2 className="mb-3 font-display text-base font-bold">💌 Cartinhas surpresa</h2>
          <div className="space-y-2">
            {CARTINHAS.map((c) => {
              const liberada = c.indiceDoDia <= indiceDeHoje
              return (
                <button
                  key={c.indiceDoDia}
                  type="button"
                  disabled={!liberada}
                  onClick={() => setCartinhaAberta(c.indiceDoDia)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left ${
                    liberada ? 'bg-rosa-50' : 'bg-rosa-50/50 opacity-60'
                  }`}
                >
                  <span className="text-2xl">{liberada ? '💌' : '🔒'}</span>
                  <span className="min-w-0 flex-1">
                    <span className="font-bilhete block text-xl text-magenta-texto">{c.titulo}</span>
                    <span className="block text-[11px] text-cinza">
                      {liberada ? 'toca pra ler de novo' : `abre no dia ${c.indiceDoDia}`}
                    </span>
                  </span>
                  {liberada && <ChevronRight size={16} className="text-rosa-300" />}
                </button>
              )
            })}
          </div>
        </Cartao>
      )}

      {/* histórico de recadinhos */}
      {recados.length > 0 && (
        <div className="space-y-3">
          <h2 className="px-1 font-display text-base font-bold">Recadinhos</h2>
          {recados.map((r) => (
            <EnvelopeRecado
              key={r.id}
              texto={r.texto}
              autor={r.autor_nome ?? (souIsabela ? 'Benjamin' : 'Isabela')}
              jaLido={r.lido}
              aoAbrir={() => !r.lido && void marcarRecadoLido(r.id)}
            />
          ))}
        </div>
      )}

      {/* perfil */}
      <Cartao>
        <div className="mb-3 flex items-center gap-3">
          <div
            className="grid h-14 w-14 place-items-center rounded-full font-display text-xl font-extrabold text-white"
            style={{ background: 'var(--gradiente)' }}
          >
            {(perfil?.nome ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold">{perfil?.nome}</p>
            <p className="text-xs text-cinza">
              {souIsabela ? `${idadeDaIsabela()} anos · quem treina 💪` : 'quem acompanha e torce 💗'}
            </p>
          </div>
        </div>

        {souIsabela && (
          <div className="divide-y divide-rosa-100">
            <LinhaPerfil rotulo="Nome" valor={perfil?.nome ?? ''} aoTocar={() => setFolha('nome')} />
            <LinhaPerfil rotulo="Altura" valor={`${altura} cm`} aoTocar={() => setFolha('altura')} />
            <LinhaPerfil
              rotulo="Peso de hoje"
              valor={peso ? `${umaCasa(peso)} kg` : '—'}
              aoTocar={() => setFolha('peso')}
            />
          </div>
        )}
      </Cartao>

      {/* números */}
      <Cartao>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Os numerinhos</h2>
          <Etiqueta texto={classe.rotulo} cor={classe.cor} />
        </div>
        <dl className="space-y-2.5 text-sm">
          <Item termo="IMC de agora" valor={umaCasa(imc)} />
          <Item termo="Faixa saudável" valor={`${umaCasa(faixa.min)} – ${umaCasa(faixa.max)} kg`} />
          <Item termo="A metinha (IMC 22)" valor={`${umaCasa(meta)} kg`} destaque />
          <Item termo="Água de hoje" valor={`${litros(metaAguaDe(hoje))} L`} destaque />
        </dl>
        <button
          type="button"
          onClick={() => setFolha('formulas')}
          className="mt-3 flex w-full items-center justify-between rounded-2xl bg-rosa-50 px-4 py-3 text-sm font-semibold text-magenta-texto"
        >
          ver as fórmulas de peso ideal <ChevronRight size={16} />
        </button>
      </Cartao>

      {/* onde tudo fica guardado */}
      <Armazenamento />

      <Botao tipo="suave" className="flex w-full items-center justify-center gap-2" onClick={() => void sair()}>
        <LogOut size={17} /> Sair da conta
      </Botao>

      <p className="px-3 pb-2 text-center text-[11px] leading-relaxed text-cinza">
        Feito com amor pelo Benjamin 💗 — Este app é só um acompanhamento pessoal e não substitui
        orientação de educador físico, nutricionista ou médico. As metas de peso e de água são
        estimativas gerais.
      </p>

      {/* folhinhas */}
      <Folhinha aberta={folha === 'nome'} aoFechar={() => setFolha(null)}>
        <h2 className="mb-4 font-display text-lg font-bold">Editar nome</h2>
        <Campo rotulo="Nome" valor={nome} aoMudar={setNome} autoFoco />
        <Botao
          className="mt-4 w-full"
          onClick={async () => {
            await salvarPerfil({ nome: nome.trim() || 'Isabela' })
            setFolha(null)
          }}
        >
          Salvar 💗
        </Botao>
      </Folhinha>

      <Folhinha aberta={folha === 'altura'} aoFechar={() => setFolha(null)}>
        <h2 className="mb-4 font-display text-lg font-bold">Editar altura</h2>
        <SeletorRolagem min={130} max={200} valor={novaAltura} aoMudar={setNovaAltura} sufixo="cm" />
        <Botao
          className="mt-4 w-full"
          onClick={async () => {
            await salvarPerfil({ altura_cm: novaAltura })
            setFolha(null)
          }}
        >
          Salvar 💗
        </Botao>
      </Folhinha>

      <Folhinha aberta={folha === 'peso'} aoFechar={() => setFolha(null)}>
        <h2 className="mb-4 font-display text-lg font-bold">Peso de hoje</h2>
        <Campo
          rotulo="Peso"
          valor={novoPeso}
          aoMudar={setNovoPeso}
          tipo="decimal"
          sufixo="kg"
          placeholder={peso ? umaCasa(peso) : '00,0'}
          autoFoco
        />
        <Botao
          className="mt-4 w-full"
          desabilitado={!novoPeso}
          onClick={async () => {
            const kg = Number(novoPeso.replace(',', '.'))
            if (!Number.isFinite(kg) || kg <= 0) return
            await salvarPeso(hoje, kg)
            setNovoPeso('')
            setFolha(null)
          }}
        >
          Salvar 💗
        </Botao>
      </Folhinha>

      <Folhinha aberta={folha === 'formulas'} aoFechar={() => setFolha(null)}>
        <h2 className="mb-3 font-display text-lg font-bold">Peso ideal — as fórmulas</h2>
        <p className="mb-4 text-sm leading-relaxed text-cinza">
          A referência principal é a faixa da OMS. As fórmulas abaixo são clássicas e entram só como
          conferência.
        </p>
        <dl className="space-y-2.5 text-sm">
          <Item termo="Devine" valor={`${umaCasa(f.devine)} kg`} />
          <Item termo="Robinson" valor={`${umaCasa(f.robinson)} kg`} />
          <Item termo="Miller" valor={`${umaCasa(f.miller)} kg`} />
          <Item termo="Hamwi" valor={`${umaCasa(f.hamwi)} kg`} />
          <Item termo="Média das quatro" valor={`${umaCasa(f.media)} kg`} destaque />
        </dl>
      </Folhinha>

      {cartinhaAberta !== null && (
        <CartinhaAberta
          cartinha={CARTINHAS.find((c) => c.indiceDoDia === cartinhaAberta)!}
          aoFechar={() => setCartinhaAberta(null)}
        />
      )}
    </Tela>
  )
}

function LinhaPerfil({
  rotulo,
  valor,
  aoTocar,
}: {
  rotulo: string
  valor: string
  aoTocar: () => void
}) {
  return (
    <button type="button" onClick={aoTocar} className="flex w-full items-center gap-3 py-3.5 text-left toque">
      <span className="flex-1 font-display text-sm font-semibold">{rotulo}</span>
      <span className="num text-sm font-semibold text-cinza">{valor}</span>
      <ChevronRight size={16} className="text-rosa-300" />
    </button>
  )
}

function Item({ termo, valor, destaque }: { termo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-cinza">{termo}</dt>
      <dd className={`num font-display font-bold ${destaque ? 'text-rosa-500' : 'text-carvao'}`}>
        {valor}
      </dd>
    </div>
  )
}
