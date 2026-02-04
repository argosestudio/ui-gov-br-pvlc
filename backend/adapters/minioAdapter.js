import { Client } from 'minio'
import { v4 as uuidv4 } from 'uuid'
import { StorageAdapter } from './storageAdapter.js'

/**
 * MinIO Storage Adapter Implementation
 * Implements the StorageAdapter interface for MinIO/S3-compatible storage.
 */
export class MinioAdapter extends StorageAdapter {
    constructor(config = {}) {
        super()
        this.client = new Client({
            endPoint: config.endPoint || process.env.MINIO_ENDPOINT || 'localhost',
            port: parseInt(config.port || process.env.MINIO_PORT || '9000'),
            useSSL: config.useSSL || process.env.MINIO_USE_SSL === 'true' || false,
            accessKey: config.accessKey || process.env.MINIO_ACCESS_KEY || 'minioadmin',
            secretKey: config.secretKey || process.env.MINIO_SECRET_KEY || 'minioadmin'
        })
        this.bucket = config.bucket || process.env.MINIO_BUCKET || 'documents'
    }

    /**
     * Initialize the adapter - ensure bucket exists
     */
    async initialize() {
        const exists = await this.client.bucketExists(this.bucket)
        if (!exists) {
            await this.client.makeBucket(this.bucket)
            console.log(`Bucket '${this.bucket}' created successfully`)
        }
        return true
    }

    /**
     * Upload a file to MinIO
     * Creates a unique folder for each file upload
     */
    async uploadFile(fileBuffer, fileName, category, mimeType) {
        const folderId = uuidv4()
        const objectPath = `${category}/${folderId}/${fileName}`

        const metadata = {
            'Content-Type': mimeType,
            'X-Amz-Meta-Category': category,
            'X-Amz-Meta-Original-Name': fileName,
            'X-Amz-Meta-Folder-Id': folderId,
            'X-Amz-Meta-Uploaded-At': new Date().toISOString()
        }

        await this.client.putObject(
            this.bucket,
            objectPath,
            fileBuffer,
            fileBuffer.length,
            metadata
        )

        return {
            folderId,
            fileName,
            category,
            objectPath,
            size: fileBuffer.length,
            uploadedAt: new Date()
        }
    }

    /**
     * Delete a file by its folder ID
     */
    async deleteFile(folderId, category) {
        // List all objects in the folder
        const objectsStream = this.client.listObjects(this.bucket, `${category}/${folderId}/`, true)
        const objectsToDelete = []

        for await (const obj of objectsStream) {
            objectsToDelete.push(obj.name)
        }

        if (objectsToDelete.length === 0) {
            return false
        }

        // Delete all objects in the folder
        await this.client.removeObjects(this.bucket, objectsToDelete)
        return true
    }

    /**
     * List all files, optionally filtered by category
     */
    async listFiles(category = null) {
        const prefix = category ? `${category}/` : ''
        const objectsStream = this.client.listObjects(this.bucket, prefix, true)
        const files = []

        for await (const obj of objectsStream) {
            // Parse the object path: category/folderId/filename
            const parts = obj.name.split('/')
            if (parts.length >= 3) {
                const [cat, folderId, ...fileNameParts] = parts
                const fileName = fileNameParts.join('/')

                files.push({
                    folderId,
                    fileName,
                    category: cat,
                    objectPath: obj.name,
                    size: obj.size,
                    uploadedAt: obj.lastModified
                })
            }
        }

        return files
    }

    /**
     * Get a file stream by folder ID and category
     */
    async getFile(folderId, category) {
        // Find the exact file in the folder
        const objectsStream = this.client.listObjects(this.bucket, `${category}/${folderId}/`, false)
        let objectName = null

        for await (const obj of objectsStream) {
            objectName = obj.name
            break
        }

        if (!objectName) {
            throw new Error('File not found')
        }

        const stream = await this.client.getObject(this.bucket, objectName)
        const stat = await this.client.statObject(this.bucket, objectName)

        // Extract filename from path
        const parts = objectName.split('/')
        const fileName = parts[parts.length - 1]

        return {
            stream,
            fileName,
            mimeType: stat.metaData?.['content-type'] || 'application/octet-stream',
            size: stat.size
        }
    }

    /**
     * Health check for the MinIO connection
     */
    async healthCheck() {
        try {
            await this.client.bucketExists(this.bucket)
            return true
        } catch (error) {
            console.error('MinIO health check failed:', error)
            return false
        }
    }
}
