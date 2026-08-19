import { chromium, devices } from 'playwright'
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs'
const RAIZ = 'C:/Users/User/AppData/Local/Temp/claude/c--Users-User-Downloads-Projetinho-Amor/5722d3ac-e689-42be-a3b6-9e997ffec4bf/scratchpad'
const OUT = `${RAIZ}/travas`; mkdirSync(OUT, { recursive: true })
const dir = `${RAIZ}/travas-perfil`; if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
const erros = []
const ctx = await chromium.launchPersistentContext(dir, { ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo', hasTouch: true, isMobile: true })
const page = ctx.pages()[0] ?? (await ctx.newPage())
page.on('pageerror', (e) => erros.push('pageerror: ' + e.message))
page.on('console', (m) => { if (m.type() === 'error' && !/vibrate|Failed to load resource/i.test(m.text())) erros.push(m.text()) })

await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2600)
await page.getByPlaceholder('Isabela').fill('Isabela')
for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: 'Continuar' }).tap(); await page.waitForTimeout(450) }
await page.getByRole('button', { name: /Bora começar/ }).tap()
await page.waitForTimeout(4000)

const hoje = new Date().toLocaleDateString('pt-BR', { day: 'numeric', timeZone: 'America/Sao_Paulo' })

/* ---- 1) concluir SEM foto -> alerta tristinho ---- */
await page.getByRole('button', { name: `Dia ${hoje}`, exact: true }).tap()
await page.waitForTimeout(1300)
await page.evaluate(() => { document.querySelector('.overscroll-contain').scrollTop = 99999 })
await page.waitForTimeout(800)
await page.getByRole('button', { name: /Concluir o dia/ }).tap()
await page.waitForTimeout(3000)
await page.screenshot({ path: `${OUT}/01-sem-foto.png` })
const t1 = await page.locator('body').innerText()
if (!/esse dia foi sem foto/i.test(t1)) erros.push('não avisou que o dia foi sem foto')
if (!/buraquinho no álbum/i.test(t1)) erros.push('o texto tristinho não apareceu')

/* o aviso demora pra sumir? (agora são 9s) */
await page.waitForTimeout(4000)
const aindaAparece = /esse dia foi sem foto/i.test(await page.locator('body').innerText())
if (!aindaAparece) erros.push('o aviso sumiu antes de 7s')
await page.getByRole('button', { name: /vou mandar uma agora/ }).tap()
await page.waitForTimeout(800)

/* ---- 2) manda uma foto -> a reclamação fica na tela mais tempo ---- */
const jpeg = await page.evaluate(async () => {
  const c = document.createElement('canvas'); c.width = 700; c.height = 900
  const x = c.getContext('2d'); x.fillStyle = '#FF74A8'; x.fillRect(0, 0, 700, 900)
  const b = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85))
  return Array.from(new Uint8Array(await b.arrayBuffer()))
})
writeFileSync(`${OUT}/uma.jpg`, Buffer.from(jpeg))
await page.locator('input[type=file]').first().setInputFiles([`${OUT}/uma.jpg`])
await page.waitForTimeout(1800)
await page.screenshot({ path: `${OUT}/02-reclamacao.png` })
const apareceu = /só uma|uma só|fica devendo|dez ângulos/i.test(await page.locator('body').innerText())
if (!apareceu) erros.push('a reclamação não apareceu')
await page.waitForTimeout(6000) // total ~7,8s: com 9s ela ainda tem que estar lá
const continua = /só uma|uma só|fica devendo|dez ângulos/i.test(await page.locator('body').innerText())
if (!continua) erros.push('a reclamação sumiu rápido demais (menos de 8s)')
await page.screenshot({ path: `${OUT}/03-reclamacao-ainda.png` })
await page.mouse.click(195, 400)
await page.waitForTimeout(1000)

/* ---- 3) dia passado fica trancado ---- */
await page.locator('button[aria-label="Fechar"]').tap()
await page.waitForTimeout(1000)
// volta o relógio? não: abre um dia anterior do calendário (17 não é do desafio) —
// então adianto o relógio pra amanhã e olho o dia de hoje, que virou passado
await page.clock.setFixedTime(new Date('2026-08-19T09:00:00-03:00'))
await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus')) })
await page.waitForTimeout(3000)
await page.getByRole('button', { name: 'Dia 18', exact: true }).tap()
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/04-dia-encerrado.png` })
const t4 = await page.locator('body').innerText()
if (!/encerrado/i.test(t4)) erros.push('não marcou o dia como encerrado')
if (!/não dá mais pra mexer/i.test(t4)) erros.push('não explicou que o dia está trancado')
const checkTravado = await page.getByRole('checkbox', { name: /Fiz a corrida/ }).isDisabled()
if (!checkTravado) erros.push('ainda dá pra marcar a corrida num dia encerrado')
const temConcluir = await page.getByRole('button', { name: /Concluir o dia/ }).count()
if (temConcluir) erros.push('o botão de concluir apareceu num dia encerrado')
const temEscolher = await page.getByRole('button', { name: /Escolher da galeria|Escolher outra/ }).count()
if (temEscolher) erros.push('ainda dá pra mandar foto num dia encerrado')

// mas dá pra ver as fotos e a cartinha
if (!/Fotinhas do dia/i.test(t4)) erros.push('não dá mais pra ver as fotinhas do dia encerrado')
if (!/CARTINHA DE HOJE|cartinha/i.test(t4)) erros.push('a cartinha sumiu do dia encerrado')

console.log(JSON.stringify({ erros }, null, 2))
await ctx.close()
