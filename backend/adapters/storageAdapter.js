/**
 * Storage Adapter Interface
 * Base class defining the contract for storage operations.
 * All storage implementations (MinIO, S3, GCS, etc.) should extend this class.
 */
export class StorageAdapter {
    /**
     * Upload a file to storage
     * @param {Buffer} fileBuffer - File content as buffer
     * @param {string} fileName - Original file name
     * @param {string} category - Document category (e.g., 'parecerJudiciario')
     * @param {string} mimeType - MIME type of the file
     * @returns {Promise<{folderId: string, fileName: string, category: string}>}
     */
    async uploadFile(fileBuffer, fileName, category, mimeType) {
        throw new Error('Method uploadFile must be implemented')
    }

    /**
     * Delete a file from storage
     * @param {string} folderId - Unique folder ID containing the file
     * @returns {Promise<boolean>}
     */
    async deleteFile(folderId) {
        throw new Error('Method deleteFile must be implemented')
    }

    /**
     * List all files in storage
     * @param {string} [category] - Optional category filter
     * @returns {Promise<Array<{folderId: string, fileName: string, category: string, size: number, uploadedAt: Date}>>}
     */
    async listFiles(category) {
        throw new Error('Method listFiles must be implemented')
    }

    /**
     * Get a file from storage
     * @param {string} folderId - Unique folder ID containing the file
     * @returns {Promise<{stream: ReadableStream, fileName: string, mimeType: string}>}
     */
    async getFile(folderId) {
        throw new Error('Method getFile must be implemented')
    }

    /**
     * Check if the storage connection is healthy
     * @returns {Promise<boolean>}
     */
    async healthCheck() {
        throw new Error('Method healthCheck must be implemented')
    }
}
