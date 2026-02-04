import { useState, useRef, useEffect } from 'react'

// Power Automate endpoint for file upload (sends to SharePoint/OneDrive)
const POWER_AUTOMATE_URL = 'https://defaulte5d3ae7c9b3848dea087f6734a2875.74.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/04ac3fc172df4049bfab5667fdf3e80d/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=aunt6uQks-8wUXCT7tI7Yw22tqGRd5UKBVYepbdDfO4'

// Local S3 API (MinIO backend)
const S3_API_URL = 'http://localhost:3001/api'

// Logger utility for clear console output
const logger = {
    info: (action, data) => {
        console.log(`%c[FileUpload] ${action}`, 'color: #1351b4; font-weight: bold;', data)
    },
    success: (action, data) => {
        console.log(`%c[FileUpload] ✅ ${action}`, 'color: #168821; font-weight: bold;', data)
    },
    error: (action, data) => {
        console.error(`%c[FileUpload] ❌ ${action}`, 'color: #e52207; font-weight: bold;', data)
    },
    warn: (action, data) => {
        console.warn(`%c[FileUpload] ⚠️ ${action}`, 'color: #ffbe2e; font-weight: bold;', data)
    }
}

function FileUpload({ id, onFilesChange, initialFiles = [] }) {
    const [files, setFiles] = useState([])
    const [isDragOver, setIsDragOver] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef(null)

    // Load initial files from server
    useEffect(() => {
        if (initialFiles.length > 0) {
            setFiles(initialFiles)
        }
    }, [initialFiles])

    // Convert file to base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => {
                // Remove the data:mime;base64, prefix
                const base64String = reader.result.split(',')[1]
                resolve(base64String)
            }
            reader.onerror = (error) => reject(error)
        })
    }

    // Upload file to S3 (MinIO) via backend
    const uploadToS3 = async (file, base64Content) => {
        logger.info('Enviando para S3...', { fileName: file.name, category: id })

        const payload = {
            fileName: file.name,
            mimeType: file.type,
            category: id,
            size: file.size,
            content: base64Content
        }

        const response = await fetch(`${S3_API_URL}/files`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            throw new Error('Erro ao salvar no S3')
        }

        const result = await response.json()
        logger.success('Salvo no S3', { folderId: result.data?.folderId, fileName: file.name })
        return result
    }

    // Upload file to Power Automate API
    const uploadToPowerAutomate = async (file, base64Content) => {
        logger.info('Enviando para Power Automate API...', {
            fileName: file.name,
            category: id,
            size: file.size,
            mimeType: file.type
        })

        const payload = {
            fileName: file.name,
            mimeType: file.type,
            category: id,
            size: file.size,
            content: base64Content
        }

        // Log do payload sendo enviado (sem o conteúdo base64 para não poluir)
        logger.info('Payload JSON:', {
            ...payload,
            content: `[base64 - ${Math.round(base64Content.length / 1024)}KB]`
        })

        const response = await fetch(POWER_AUTOMATE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errorText = await response.text()
            logger.error('Power Automate falhou', { status: response.status, error: errorText })
            throw new Error('Erro ao enviar para Power Automate')
        }

        const result = await response.json().catch(() => ({}))
        logger.success('Enviado para Power Automate', { response: result })
        return result
    }

    // Upload file to BOTH S3 and Power Automate in parallel
    const uploadFile = async (file) => {
        const base64Content = await fileToBase64(file)

        logger.info('=== INICIANDO UPLOAD ===', {
            fileName: file.name,
            size: `${(file.size / 1024).toFixed(2)} KB`,
            type: file.type,
            category: id
        })

        // Execute both uploads in parallel
        const [s3Result, paResult] = await Promise.allSettled([
            uploadToS3(file, base64Content),
            uploadToPowerAutomate(file, base64Content)
        ])

        // Log results
        const s3Success = s3Result.status === 'fulfilled'
        const paSuccess = paResult.status === 'fulfilled'

        if (s3Success && paSuccess) {
            logger.success('=== UPLOAD COMPLETO ===', {
                fileName: file.name,
                s3: '✅ OK',
                powerAutomate: '✅ OK'
            })
        } else {
            logger.warn('=== UPLOAD PARCIAL ===', {
                fileName: file.name,
                s3: s3Success ? '✅ OK' : `❌ ${s3Result.reason?.message}`,
                powerAutomate: paSuccess ? '✅ OK' : `❌ ${paResult.reason?.message}`
            })
        }

        // Return file data (use S3 result if available, otherwise generate ID)
        const folderId = s3Success
            ? s3Result.value.data?.folderId
            : crypto.randomUUID()

        return {
            data: {
                fileName: file.name,
                category: id,
                size: file.size,
                mimeType: file.type,
                folderId: folderId,
                s3Synced: s3Success,
                paSynced: paSuccess
            }
        }
    }

    // Delete file from S3
    const deleteFromS3 = async (folderId) => {
        logger.info('Removendo do S3...', { folderId, category: id })

        const response = await fetch(`${S3_API_URL}/files/${id}/${folderId}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error('Erro ao remover do S3')
        }

        logger.success('Removido do S3', { folderId })
        return response.json()
    }

    const addFiles = async (newFiles) => {
        const validFiles = Array.from(newFiles).filter(file => {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            // Check file size (max 10MB)
            const maxSize = 10 * 1024 * 1024
            if (file.size > maxSize) {
                logger.error('Arquivo muito grande', { fileName: file.name, size: file.size })
                alert(`Arquivo ${file.name} excede o tamanho máximo de 10MB`)
                return false
            }
            return validTypes.includes(file.type) || file.type.startsWith('image/')
        })

        if (validFiles.length === 0) return

        setIsUploading(true)

        try {
            const uploadedFiles = []

            for (const file of validFiles) {
                const result = await uploadFile(file)
                uploadedFiles.push({
                    ...result.data,
                    name: result.data.fileName,
                    type: file.type
                })
            }

            const updatedFiles = [...files, ...uploadedFiles]
            setFiles(updatedFiles)
            onFilesChange?.(id, updatedFiles)
        } catch (error) {
            logger.error('Erro no upload', error)
            alert('Erro ao fazer upload do arquivo.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileSelect = (e) => {
        addFiles(e.target.files)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragOver(false)
        addFiles(e.dataTransfer.files)
    }

    const removeFile = async (index) => {
        const fileToRemove = files[index]

        logger.info('=== REMOVENDO ARQUIVO ===', {
            fileName: fileToRemove.name || fileToRemove.fileName,
            folderId: fileToRemove.folderId
        })

        try {
            // Delete from S3 if it was synced
            if (fileToRemove.folderId) {
                await deleteFromS3(fileToRemove.folderId)
            }

            const updatedFiles = files.filter((_, i) => i !== index)
            setFiles(updatedFiles)
            onFilesChange?.(id, updatedFiles)

            logger.success('Arquivo removido com sucesso', {
                fileName: fileToRemove.name || fileToRemove.fileName
            })
        } catch (error) {
            logger.error('Erro ao remover arquivo', error)
            // Still remove from UI even if S3 delete fails
            const updatedFiles = files.filter((_, i) => i !== index)
            setFiles(updatedFiles)
            onFilesChange?.(id, updatedFiles)
        }
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const openFileDialog = () => {
        if (!isUploading) {
            fileInputRef.current?.click()
        }
    }

    return (
        <div className="file-upload-component">
            <div
                className={`upload-area upload-area-compact ${isDragOver ? 'dragover' : ''} ${isUploading ? 'uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFileDialog}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && openFileDialog()}
                aria-label="Área para envio de arquivos"
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                    style={{ display: 'none' }}
                    disabled={isUploading}
                />
                {isUploading ? (
                    <>
                        <i className="fas fa-spinner fa-spin upload-icon-small" aria-hidden="true"></i>
                        <p className="upload-text-small">
                            <strong>Enviando...</strong>
                        </p>
                    </>
                ) : (
                    <>
                        <i className="fas fa-cloud-upload-alt upload-icon-small" aria-hidden="true"></i>
                        <p className="upload-text-small">
                            <strong>Clique aqui</strong> ou arraste seus arquivos
                        </p>
                        <p className="upload-hint-small">
                            PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
                        </p>
                    </>
                )}
            </div>

            {files.length > 0 && (
                <div className="file-list-compact" role="list">
                    {files.map((file, index) => (
                        <div key={file.folderId || index} className="file-item-compact" role="listitem">
                            <div className="file-info">
                                <i className={`fas ${file.type?.includes('pdf') ? 'fa-file-pdf' : file.type?.includes('image') ? 'fa-file-image' : 'fa-file-word'}`} aria-hidden="true"></i>
                                <div>
                                    <div className="file-name-small">{file.name || file.fileName}</div>
                                    <div className="file-size-small">
                                        {formatFileSize(file.size)}
                                        {file.s3Synced === false && <span title="Não sincronizado com S3"> ⚠️</span>}
                                    </div>
                                </div>
                            </div>
                            <button
                                className="remove-file"
                                onClick={(e) => { e.stopPropagation(); removeFile(index) }}
                                aria-label={`Remover arquivo ${file.name || file.fileName}`}
                                type="button"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default FileUpload
