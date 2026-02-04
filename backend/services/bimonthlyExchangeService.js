/**
 * BimonthlyExchangeService
 * 
 * Serviço de consulta de taxa de câmbio PTAX do Banco Central do Brasil.
 * Implementa a regra de negócio: A cotação utilizada deve ser sempre 
 * referente à PRIMEIRA DATA do BIMESTRE ATUAL.
 * 
 * Features:
 * - Cálculo dinâmico de data do bimestre (Jan/Fev, Mar/Abr, Mai/Jun, Jul/Ago, Set/Out, Nov/Dez)
 * - Fall-forward para dias não úteis (feriados/fins de semana)
 * - Cache agressivo (TTL longo - a taxa não muda após fechada)
 * - Exponential backoff para retry de falhas de rede
 */

// Cache em memória com TTL
const cache = {
    data: null,
    expiresAt: null,
    bimonthKey: null // Para invalidar cache quando mudar o bimestre
}

// Configurações
const CONFIG = {
    BC_API_BASE: 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata',
    MAX_RETRY_DAYS: 5, // Máximo de dias para tentar encontrar cotação
    MAX_NETWORK_RETRIES: 3, // Máximo de retries para falhas de rede
    INITIAL_RETRY_DELAY_MS: 1000, // Delay inicial para exponential backoff
    CACHE_TTL_MS: 7 * 24 * 60 * 60 * 1000 // 7 dias (pode ser maior, pois a taxa não muda)
}

/**
 * Calcula o primeiro dia do bimestre atual
 * @param {Date} referenceDate - Data de referência (padrão: hoje)
 * @returns {{ startDate: Date, bimonthKey: string }}
 */
function getBimonthStart(referenceDate = new Date()) {
    const year = referenceDate.getFullYear()
    const month = referenceDate.getMonth() // 0-indexed

    // Determinar o mês inicial do bimestre
    // 0,1 -> 0 (Jan/Fev -> Janeiro)
    // 2,3 -> 2 (Mar/Abr -> Março)
    // 4,5 -> 4 (Mai/Jun -> Maio)
    // 6,7 -> 6 (Jul/Ago -> Julho)
    // 8,9 -> 8 (Set/Out -> Setembro)
    // 10,11 -> 10 (Nov/Dez -> Novembro)
    const bimonthStartMonth = Math.floor(month / 2) * 2

    const startDate = new Date(year, bimonthStartMonth, 1)
    const bimonthKey = `${year}-B${Math.floor(bimonthStartMonth / 2) + 1}` // Ex: "2026-B1"

    return { startDate, bimonthKey }
}

/**
 * Formata data para o padrão da API do BC (MM-DD-YYYY)
 * @param {Date} date 
 * @returns {string}
 */
function formatDateForBC(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}-${day}-${year}`
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 * @param {Date} date 
 * @returns {string}
 */
function formatDateForDisplay(date) {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
}

/**
 * Faz requisição à API do BC com retry e exponential backoff
 * @param {string} url 
 * @param {number} retryCount 
 * @returns {Promise<object>}
 */
async function fetchWithRetry(url, retryCount = 0) {
    try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        })

        clearTimeout(timeout)

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        if (retryCount < CONFIG.MAX_NETWORK_RETRIES) {
            const delay = CONFIG.INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount)
            console.log(`[PTAX] Retry ${retryCount + 1}/${CONFIG.MAX_NETWORK_RETRIES} após ${delay}ms...`)
            await new Promise(resolve => setTimeout(resolve, delay))
            return fetchWithRetry(url, retryCount + 1)
        }
        throw new Error(`Falha na conexão com BC após ${CONFIG.MAX_NETWORK_RETRIES} tentativas: ${error.message}`)
    }
}

/**
 * Busca cotação PTAX para uma data específica
 * @param {Date} date 
 * @returns {Promise<{cotacaoVenda: number, cotacaoCompra: number, dataHoraCotacao: string} | null>}
 */
async function fetchPTAXForDate(date) {
    const formattedDate = formatDateForBC(date)
    const url = `${CONFIG.BC_API_BASE}/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${formattedDate}'&$format=json`

    console.log(`[PTAX] Consultando cotação para ${formattedDate}...`)

    const data = await fetchWithRetry(url)

    // Validar resposta
    if (!data || !data.value || !Array.isArray(data.value)) {
        throw new Error('Resposta inválida da API do BC')
    }

    if (data.value.length === 0) {
        console.log(`[PTAX] Nenhuma cotação disponível para ${formattedDate}`)
        return null
    }

    const cotacao = data.value[0]

    // Validar campos obrigatórios
    if (typeof cotacao.cotacaoVenda !== 'number' || isNaN(cotacao.cotacaoVenda)) {
        throw new Error(`cotacaoVenda inválida: ${cotacao.cotacaoVenda}`)
    }

    if (typeof cotacao.cotacaoCompra !== 'number' || isNaN(cotacao.cotacaoCompra)) {
        throw new Error(`cotacaoCompra inválida: ${cotacao.cotacaoCompra}`)
    }

    return {
        cotacaoVenda: cotacao.cotacaoVenda,
        cotacaoCompra: cotacao.cotacaoCompra,
        dataHoraCotacao: cotacao.dataHoraCotacao
    }
}

/**
 * Obtém a taxa de câmbio PTAX do primeiro dia útil do bimestre atual.
 * Implementa fall-forward para encontrar o primeiro dia com cotação.
 * Utiliza cache agressivo.
 * 
 * @returns {Promise<{
 *   cotacaoVenda: number,
 *   cotacaoCompra: number,
 *   dataReferencia: string,
 *   dataCotacao: string,
 *   bimestre: string,
 *   fonte: string,
 *   cached: boolean
 * }>}
 */
export async function getCurrentBimonthlyRate() {
    const { startDate, bimonthKey } = getBimonthStart()

    // Verificar cache
    if (cache.data && cache.bimonthKey === bimonthKey && cache.expiresAt > Date.now()) {
        console.log(`[PTAX] Retornando do cache (bimestre: ${bimonthKey})`)
        return { ...cache.data, cached: true }
    }

    console.log(`[PTAX] Buscando cotação para bimestre ${bimonthKey}...`)

    // Fall-forward: tentar dias consecutivos até encontrar cotação
    let currentDate = new Date(startDate)
    let cotacao = null

    for (let dayOffset = 0; dayOffset < CONFIG.MAX_RETRY_DAYS; dayOffset++) {
        currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + dayOffset)

        cotacao = await fetchPTAXForDate(currentDate)

        if (cotacao) {
            break
        }
    }

    if (!cotacao) {
        throw new Error(
            `Não foi possível encontrar cotação PTAX para o bimestre ${bimonthKey}. ` +
            `Tentados os primeiros ${CONFIG.MAX_RETRY_DAYS} dias a partir de ${formatDateForDisplay(startDate)}.`
        )
    }

    const result = {
        cotacaoVenda: cotacao.cotacaoVenda,
        cotacaoCompra: cotacao.cotacaoCompra,
        dataReferencia: formatDateForDisplay(startDate),
        dataCotacao: formatDateForDisplay(currentDate),
        bimestre: bimonthKey,
        fonte: 'Banco Central do Brasil - API PTAX',
        cached: false
    }

    // Armazenar em cache
    cache.data = result
    cache.bimonthKey = bimonthKey
    cache.expiresAt = Date.now() + CONFIG.CACHE_TTL_MS

    console.log(`[PTAX] Cotação encontrada: R$ ${cotacao.cotacaoVenda.toFixed(4)} (${formatDateForDisplay(currentDate)})`)

    return result
}

/**
 * Limpa o cache (útil para testes)
 */
export function clearCache() {
    cache.data = null
    cache.expiresAt = null
    cache.bimonthKey = null
}

/**
 * Retorna informações sobre o bimestre atual (sem buscar cotação)
 */
export function getCurrentBimonthInfo() {
    const { startDate, bimonthKey } = getBimonthStart()

    const bimonthNames = {
        'B1': 'Janeiro/Fevereiro',
        'B2': 'Março/Abril',
        'B3': 'Maio/Junho',
        'B4': 'Julho/Agosto',
        'B5': 'Setembro/Outubro',
        'B6': 'Novembro/Dezembro'
    }

    const bimonthNumber = bimonthKey.split('-')[1]

    return {
        bimonthKey,
        bimonthName: bimonthNames[bimonthNumber],
        startDate: formatDateForDisplay(startDate),
        year: startDate.getFullYear()
    }
}
