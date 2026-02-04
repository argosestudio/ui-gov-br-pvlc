import { useState, useRef } from 'react'

function FileUpload({ id, onFilesChange }) {
    const [files, setFiles] = useState([])
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef(null)

    const addFiles = (newFiles) => {
        const validFiles = Array.from(newFiles).filter(file => {
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            return validTypes.includes(file.type) || file.type.startsWith('image/')
        })
        const updatedFiles = [...files, ...validFiles]
        setFiles(updatedFiles)
        onFilesChange?.(id, updatedFiles)
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

    const removeFile = (index) => {
        const updatedFiles = files.filter((_, i) => i !== index)
        setFiles(updatedFiles)
        onFilesChange?.(id, updatedFiles)
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const openFileDialog = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="file-upload-component">
            <div
                className={`upload-area upload-area-compact ${isDragOver ? 'dragover' : ''}`}
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
                />
                <i className="fas fa-cloud-upload-alt upload-icon-small" aria-hidden="true"></i>
                <p className="upload-text-small">
                    <strong>Clique aqui</strong> ou arraste seus arquivos
                </p>
                <p className="upload-hint-small">
                    PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
                </p>
            </div>

            {files.length > 0 && (
                <div className="file-list-compact" role="list">
                    {files.map((file, index) => (
                        <div key={index} className="file-item-compact" role="listitem">
                            <div className="file-info">
                                <i className={`fas ${file.type.includes('pdf') ? 'fa-file-pdf' : file.type.includes('image') ? 'fa-file-image' : 'fa-file-word'}`} aria-hidden="true"></i>
                                <div>
                                    <div className="file-name-small">{file.name}</div>
                                    <div className="file-size-small">{formatFileSize(file.size)}</div>
                                </div>
                            </div>
                            <button
                                className="remove-file"
                                onClick={(e) => { e.stopPropagation(); removeFile(index) }}
                                aria-label={`Remover arquivo ${file.name}`}
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
