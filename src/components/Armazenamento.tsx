import { motion } from 'framer-motion'
import { CloudUpload, Download, HardDriveDownload, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { estadoDoArmazenamento, pedirArmazenamentoPermanente } from '../data/bancoLocal'
import { restaurarBackup, salvarBackup } from '../data/backup'
import { useEstado } from '../data/estado'
import { API_URL, MODO } from '../lib/config'
import { vibrar } from '../lib/feedback'
import { Botao, Cartao } from './ui'

/** Onde tudo fica guardado — e o botão de backup, que é a rede de segurança. */
export function Armazenamento() {
  const { remoto, snap, recarregar } = useEstado()
  const [permanente, setPermanente] = useState<boolean | null>(null)
  const [usado, setUsado] = useState<number | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function atualizar() {
    const e = await estadoDoArmazenamento()
    setPermanente(e.permanente)
    setUsado(e.usadoMb)
  }

  useEffect(() => {
    void atualizar()
  }, [])

  const registros =
    snap.dias.length + snap.pesos.length + snap.fotos.length + snap.recados.length

  async function fazerBackup() {
    setOcupado(true)
    setAviso(null)
    try {
      const { tamanhoMb } = await salvarBackup()
      vibrar(60)
      setAviso(`backup salvo (${tamanhoMb.toFixed(1)} MB) 💗`)
    } catch (e) {
      console.error(e)
      setAviso('não deu pra salvar o backup agora')
    } finally {
      setOcupado(false)
    }
  }

  async function restaurar(arquivo: File) {
    setOcupado(true)
    setAviso(null)
    try {
      const r = await restaurarBackup(arquivo)
      await recarregar()
      await atualizar()
      vibrar([60, 40, 60])
      setAviso(`restaurado: ${r.dias} dias e ${r.fotos} fotinhas 💗`)
    } catch (e) {
      console.error(e)
      setAviso(e instanceof Error ? e.message : 'não consegui ler esse arquivo')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Cartao>
      <h2 className="mb-2 flex items-center gap-2 font-display text-base font-bold">
        {remoto ? (
          <CloudUpload size={18} className="text-rosa-400" />
        ) : (
          <ShieldCheck size={18} className="text-rosa-400" />
        )}
        Onde tudo fica guardado
      </h2>

      {MODO === 'supabase' ? (
        <p className="text-sm leading-relaxed text-cinza">
          Na nuvem, na conta de vocês dois. Cada check, cada fotinha e cada recadinho vai pro banco
          assim que você toca — e aparece no outro celular na hora. As fotinhas ficam num lugar
          privado, que só vocês abrem, por links que expiram em 1 hora.
        </p>
      ) : MODO === 'servidor' ? (
        <>
          <p className="text-sm leading-relaxed text-cinza">
            No banco de dados que roda no computador de casa. Os dois celulares apontam pro mesmo
            lugar, então o que você marca aparece no outro celular em poucos segundos.
          </p>
          <dl className="mt-3 space-y-2 rounded-2xl bg-rosa-50 p-3 text-sm">
            <Linha termo="Registros guardados" valor={`${registros}`} />
            <Linha termo="Servidor" valor={API_URL.replace(/^https?:\/\//, '')} />
          </dl>
          <p className="mt-3 rounded-2xl bg-dourado/20 p-3 text-xs leading-snug text-carvao">
            Funciona enquanto o computador estiver ligado e os celulares no mesmo Wi-Fi. Pra
            funcionar na rua também, é o Supabase — o passo a passo está no README.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-cinza">
            Neste aparelho, num banco de dados do próprio celular. Fecha o app, desliga o celular,
            fica sem internet — continua tudo lá.
          </p>

          <dl className="mt-3 space-y-2 rounded-2xl bg-rosa-50 p-3 text-sm">
            <Linha termo="Registros guardados" valor={`${registros}`} />
            <Linha termo="Espaço usado" valor={tamanhoLegivel(usado)} />
            <Linha
              termo="Proteção contra limpeza"
              valor={permanente == null ? '…' : permanente ? 'ligada ✅' : 'ainda não'}
            />
          </dl>

          {permanente === false && (
            <button
              type="button"
              onClick={async () => {
                const ok = await pedirArmazenamentoPermanente()
                setPermanente(ok)
                setAviso(
                  ok
                    ? 'prontinho, o navegador não vai apagar mais 💗'
                    : 'o navegador não deixou agora — adicione o app à tela de início e tente de novo',
                )
              }}
              className="mt-2 w-full rounded-2xl bg-rosa-100 px-4 py-2.5 text-xs font-semibold text-magenta-texto"
            >
              Proteger os dados contra limpeza automática
            </button>
          )}

          <p className="mt-3 rounded-2xl bg-dourado/20 p-3 text-xs leading-snug text-carvao">
            Só neste celular, por enquanto: o Benjamin ainda não enxerga daqui. Pra isso é o
            Supabase — 30 minutinhos de configuração, o passo a passo está no README.
          </p>

          <div className="mt-3 flex flex-col gap-2">
            <Botao
              className="flex w-full items-center justify-center gap-2"
              onClick={fazerBackup}
              desabilitado={ocupado}
            >
              <Download size={17} /> Salvar backup de tudo 💾
            </Botao>
            <Botao
              tipo="suave"
              className="flex w-full items-center justify-center gap-2"
              onClick={() => inputRef.current?.click()}
              desabilitado={ocupado}
            >
              <HardDriveDownload size={17} /> Restaurar de um backup
            </Botao>
            <input
              ref={inputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const arquivo = e.target.files?.[0]
                e.target.value = ''
                if (arquivo) void restaurar(arquivo)
              }}
            />
          </div>

          <p className="mt-2 text-center text-[11px] leading-snug text-cinza">
            o backup é um arquivo só, com as fotinhas dentro — dá pra guardar no Drive ou mandar
            pro seu celular
          </p>
        </>
      )}

      {aviso && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-bilhete mt-2 text-center text-xl text-magenta-texto"
        >
          {aviso}
        </motion.p>
      )}
    </Cartao>
  )
}

function tamanhoLegivel(mb: number | null): string {
  if (mb == null) return '—'
  if (mb < 1) return `${Math.max(1, Math.round(mb * 1024))} KB`
  return `${mb.toFixed(1)} MB`
}

function Linha({ termo, valor }: { termo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-cinza">{termo}</dt>
      <dd className="num font-display font-bold text-carvao">{valor}</dd>
    </div>
  )
}
