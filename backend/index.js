import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { MinioAdapter } from './adapters/minioAdapter.js'
import { getCurrentBimonthlyRate, getCurrentBimonthInfo } from './services/bimonthlyExchangeService.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Configure multer for file uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Tipo de arquivo não permitido'), false)
        }
    }
})

// Initialize storage adapter
let storage = null

// Initialize storage on startup (may fail if MinIO is not running)
async function initializeStorage() {
    try {
        storage = new MinioAdapter()
        await storage.initialize()
        console.log('✅ Storage initialized successfully')
    } catch (error) {
        console.warn('⚠️ Storage not available (MinIO not running):', error.message)
        storage = null
    }
}

// ===== API Routes =====

/**
 * POST /api/files
 * Upload a file to storage
 * Supports both:
 * - FormData with multipart/form-data (legacy)
 * - JSON with base64 encoded content (new)
 */
app.post('/api/files', async (req, res) => {
    try {
        if (!storage) {
            return res.status(503).json({ error: 'Storage não disponível. Inicie o MinIO.' })
        }

        // Check if this is a JSON request with base64 content
        if (req.is('application/json') && req.body.content) {
            const { fileName, mimeType, category, size, content } = req.body

            if (!fileName || !content || !category) {
                return res.status(400).json({
                    error: 'Campos obrigatórios: fileName, content (base64), category'
                })
            }

            // Validate mime type
            const allowedTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
            if (!allowedTypes.includes(mimeType)) {
                return res.status(400).json({ error: 'Tipo de arquivo não permitido' })
            }

            // Convert base64 to buffer
            const fileBuffer = Buffer.from(content, 'base64')

            // Upload to storage
            const result = await storage.uploadFile(
                fileBuffer,
                fileName,
                category,
                mimeType
            )

            return res.status(201).json({
                success: true,
                data: result
            })
        }

        // Legacy: Handle FormData with multer
        upload.single('file')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message })
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Nenhum arquivo enviado' })
            }

            const { category } = req.body
            if (!category) {
                return res.status(400).json({ error: 'Categoria é obrigatória' })
            }

            const result = await storage.uploadFile(
                req.file.buffer,
                req.file.originalname,
                category,
                req.file.mimetype
            )

            res.status(201).json({
                success: true,
                data: result
            })
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        res.status(500).json({ error: 'Erro ao fazer upload do arquivo' })
    }
})

/**
 * GET /api/files
 * List all files, optionally filtered by category
 */
app.get('/api/files', async (req, res) => {
    try {
        if (!storage) {
            return res.json({ success: true, data: [] })
        }

        const { category } = req.query
        const files = await storage.listFiles(category || null)

        res.json({
            success: true,
            data: files
        })
    } catch (error) {
        console.error('Error listing files:', error)
        res.status(500).json({ error: 'Erro ao listar arquivos' })
    }
})

/**
 * GET /api/files/:category/:folderId
 * Download a specific file
 */
app.get('/api/files/:category/:folderId', async (req, res) => {
    try {
        if (!storage) {
            return res.status(503).json({ error: 'Storage não disponível' })
        }

        const { category, folderId } = req.params
        const file = await storage.getFile(folderId, category)

        res.set({
            'Content-Type': file.mimeType,
            'Content-Disposition': `attachment; filename="${file.fileName}"`,
            'Content-Length': file.size
        })

        file.stream.pipe(res)
    } catch (error) {
        console.error('Error downloading file:', error)
        if (error.message === 'File not found') {
            res.status(404).json({ error: 'Arquivo não encontrado' })
        } else {
            res.status(500).json({ error: 'Erro ao baixar arquivo' })
        }
    }
})

/**
 * DELETE /api/files/:category/:folderId
 * Delete a file by its folder ID
 */
app.delete('/api/files/:category/:folderId', async (req, res) => {
    try {
        if (!storage) {
            return res.status(503).json({ error: 'Storage não disponível' })
        }

        const { category, folderId } = req.params
        const deleted = await storage.deleteFile(folderId, category)

        if (!deleted) {
            return res.status(404).json({ error: 'Arquivo não encontrado' })
        }

        res.json({
            success: true,
            message: 'Arquivo removido com sucesso'
        })
    } catch (error) {
        console.error('Error deleting file:', error)
        res.status(500).json({ error: 'Erro ao remover arquivo' })
    }
})

// ===== Webhook Routes =====

// In-memory store for file analysis results (use Redis/DB in production)
const fileAnalysisResults = new Map()

/**
 * POST /api/webhook/file-analysis
 * Webhook endpoint to receive file analysis results from Power Automate
 * 
 * Expected payload:
 * {
 *   "fileId": "uuid",
 *   "fileName": "documento.pdf",
 *   "category": "parecerTecnico",
 *   "status": "success" | "error" | "pending",
 *   "analysis": {
 *     "isValid": true,
 *     "documentType": "Parecer Técnico",
 *     "extractedData": { ... },
 *     "validationErrors": [],
 *     "metadata": { ... }
 *   },
 *   "processedAt": "2026-02-04T15:25:00Z",
 *   "message": "Optional message"
 * }
 */
app.post('/api/webhook/file-analysis', async (req, res) => {
    const timestamp = new Date().toISOString()

    console.log('\n' + '='.repeat(60))
    console.log('[WEBHOOK] 📥 Recebendo análise de arquivo')
    console.log('[WEBHOOK] Timestamp:', timestamp)
    console.log('[WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2))
    console.log('[WEBHOOK] Payload:', JSON.stringify(req.body, null, 2))
    console.log('='.repeat(60) + '\n')

    try {
        const {
            fileId,
            fileName,
            category,
            status,
            analysis,
            processedAt,
            message
        } = req.body

        // Validate required fields
        if (!fileId) {
            console.log('[WEBHOOK] ❌ Erro: fileId é obrigatório')
            return res.status(400).json({
                success: false,
                error: 'Campo obrigatório: fileId'
            })
        }

        // Store the analysis result
        const resultData = {
            fileId,
            fileName: fileName || 'unknown',
            category: category || 'unknown',
            status: status || 'received',
            analysis: analysis || {},
            processedAt: processedAt || timestamp,
            receivedAt: timestamp,
            message: message || null
        }

        fileAnalysisResults.set(fileId, resultData)

        console.log('[WEBHOOK] ✅ Análise armazenada com sucesso')
        console.log('[WEBHOOK] FileId:', fileId)
        console.log('[WEBHOOK] Status:', status)
        console.log('[WEBHOOK] Total de análises armazenadas:', fileAnalysisResults.size)

        // Process based on status
        if (status === 'success') {
            console.log('[WEBHOOK] 📋 Documento válido - processando dados...')
            // Here you could trigger additional processing
            // e.g., update database, send notifications, etc.
        } else if (status === 'error') {
            console.log('[WEBHOOK] ⚠️ Erro na análise:', message)
        }

        res.json({
            success: true,
            message: 'Análise recebida e processada com sucesso',
            data: {
                fileId,
                receivedAt: timestamp
            }
        })

    } catch (error) {
        console.error('[WEBHOOK] ❌ Erro ao processar webhook:', error)
        res.status(500).json({
            success: false,
            error: 'Erro ao processar webhook',
            details: error.message
        })
    }
})

/**
 * GET /api/webhook/file-analysis/:fileId
 * Get the analysis result for a specific file
 */
app.get('/api/webhook/file-analysis/:fileId', (req, res) => {
    const { fileId } = req.params

    console.log('[WEBHOOK] 🔍 Consultando análise:', fileId)

    const result = fileAnalysisResults.get(fileId)

    if (!result) {
        return res.status(404).json({
            success: false,
            error: 'Análise não encontrada para este arquivo'
        })
    }

    res.json({
        success: true,
        data: result
    })
})

/**
 * GET /api/webhook/file-analysis
 * List all stored analysis results
 */
app.get('/api/webhook/file-analysis', (req, res) => {
    const results = Array.from(fileAnalysisResults.values())

    console.log('[WEBHOOK] 📋 Listando todas as análises:', results.length)

    res.json({
        success: true,
        count: results.length,
        data: results
    })
})

// ===== PTAX Exchange Rate Routes =====

/**
 * GET /api/ptax
 * Get the PTAX exchange rate for the first business day of the current bimonth
 */
app.get('/api/ptax', async (req, res) => {
    try {
        const rate = await getCurrentBimonthlyRate()

        res.json({
            success: true,
            data: rate
        })
    } catch (error) {
        console.error('Error fetching PTAX rate:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

/**
 * GET /api/ptax/info
 * Get information about the current bimonth (without fetching the rate)
 */
app.get('/api/ptax/info', (req, res) => {
    try {
        const info = getCurrentBimonthInfo()

        res.json({
            success: true,
            data: info
        })
    } catch (error) {
        console.error('Error getting bimonth info:', error)
        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
    try {
        const storageHealthy = storage ? await storage.healthCheck() : false

        res.json({
            status: storageHealthy ? 'healthy' : 'degraded',
            storage: storageHealthy ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        })
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        })
    }
})

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Arquivo muito grande. Máximo: 10MB' })
        }
    }
    console.error('Unhandled error:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
})

// Start server
initializeStorage().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`)
        console.log(`📦 Storage bucket: documents`)
    })
})
