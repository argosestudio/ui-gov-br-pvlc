import { useState, useRef, useEffect } from 'react'

const API_URL = 'http://localhost:3001/api'

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

    // Upload file as base64 via JSON API
    const uploadToServer = async (file) => {
        const base64Content = await fileToBase64(file)

        const payload = {
            fileName: file.name,
            mimeType: file.type,
            category: id,
            size: file.size,
            content: base64Content // base64 encoded file content
        }

        const response = await fetch(`${API_URL}/files`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            throw new Error('Erro ao fazer upload')
        }

        return response.json()
    }

    const deleteFromServer = async (folderId) => {
        const response = await fetch(`${API_URL}/files/${id}/${folderId}`, {
            method: 'DELETE'
        })

        if (!response.ok) {
            throw new Error('Erro ao remover arquivo')
        }

        return response.json()
    }

    const addFiles = async (newFiles) => {
        const validFiles = Array.from(newFiles).filter(file => {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            // Check file size (max 10MB)
            const maxSize = 10 * 1024 * 1024
            if (file.size > maxSize) {
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
                const result = await uploadToServer(file)
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
            console.error('Erro ao fazer upload:', error)
            alert('Erro ao fazer upload do arquivo. Verifique se o servidor está rodando.')
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

        try {
            if (fileToRemove.folderId) {
                await deleteFromServer(fileToRemove.folderId)
            }

            const updatedFiles = files.filter((_, i) => i !== index)
            setFiles(updatedFiles)
            onFilesChange?.(id, updatedFiles)
        } catch (error) {
            console.error('Erro ao remover arquivo:', error)
            alert('Erro ao remover arquivo do servidor.')
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
                                    <div className="file-size-small">{formatFileSize(file.size)}</div>
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
