import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { MinioAdapter } from './adapters/minioAdapter.js'

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
const storage = new MinioAdapter()

// Initialize storage on startup
async function initializeStorage() {
    try {
        await storage.initialize()
        console.log('✅ Storage initialized successfully')
    } catch (error) {
        console.error('❌ Failed to initialize storage:', error)
        process.exit(1)
    }
}

// ===== API Routes =====

/**
 * POST /api/files
 * Upload a file to storage
 */
app.post('/api/files', upload.single('file'), async (req, res) => {
    try {
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

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
    try {
        const storageHealthy = await storage.healthCheck()

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
