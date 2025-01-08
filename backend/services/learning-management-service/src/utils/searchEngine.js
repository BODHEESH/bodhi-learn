const { Client } = require('@elastic/elasticsearch');
const config = require('../config/config');
const logger = require('../config/logger');

class SearchEngine {
    constructor() {
        this.client = new Client({
            node: config.elasticsearch.url,
            auth: {
                username: config.elasticsearch.username,
                password: config.elasticsearch.password
            }
        });
        this.initializeIndices();
    }

    async initializeIndices() {
        try {
            // Content index
            await this.createIndexIfNotExists('content', {
                mappings: {
                    properties: {
                        title: { type: 'text', analyzer: 'standard' },
                        description: { type: 'text', analyzer: 'standard' },
                        content: { type: 'text', analyzer: 'standard' },
                        tags: { type: 'keyword' },
                        type: { type: 'keyword' },
                        status: { type: 'keyword' },
                        metadata: {
                            properties: {
                                difficulty: { type: 'keyword' },
                                topics: { type: 'keyword' },
                                skills: { type: 'keyword' }
                            }
                        },
                        organizationId: { type: 'keyword' },
                        tenantId: { type: 'keyword' },
                        createdAt: { type: 'date' }
                    }
                }
            });

            // Media index
            await this.createIndexIfNotExists('media', {
                mappings: {
                    properties: {
                        title: { type: 'text', analyzer: 'standard' },
                        description: { type: 'text', analyzer: 'standard' },
                        transcription: { type: 'text', analyzer: 'standard' },
                        annotations: { type: 'text', analyzer: 'standard' },
                        type: { type: 'keyword' },
                        tags: { type: 'keyword' },
                        metadata: {
                            properties: {
                                duration: { type: 'float' },
                                format: { type: 'keyword' },
                                quality: { type: 'keyword' }
                            }
                        },
                        organizationId: { type: 'keyword' },
                        tenantId: { type: 'keyword' },
                        createdAt: { type: 'date' }
                    }
                }
            });
        } catch (error) {
            logger.error('Error initializing search indices:', error);
        }
    }

    async createIndexIfNotExists(index, settings) {
        try {
            const exists = await this.client.indices.exists({ index });
            if (!exists) {
                await this.client.indices.create({
                    index,
                    body: settings
                });
            }
        } catch (error) {
            logger.error(`Error creating index ${index}:`, error);
            throw error;
        }
    }

    /**
     * Index content document
     * @param {Object} content - Content object
     * @returns {Promise<void>}
     */
    async indexContent(content) {
        try {
            await this.client.index({
                index: 'content',
                id: content._id.toString(),
                body: {
                    title: content.title,
                    description: content.description,
                    content: this.extractContentText(content.blocks),
                    tags: content.metadata?.tags || [],
                    type: content.type,
                    status: content.status,
                    metadata: content.metadata,
                    organizationId: content.organizationId,
                    tenantId: content.tenantId,
                    createdAt: content.createdAt
                }
            });
        } catch (error) {
            logger.error('Error indexing content:', error);
            throw error;
        }
    }

    /**
     * Index media document
     * @param {Object} media - Media object
     * @returns {Promise<void>}
     */
    async indexMedia(media) {
        try {
            await this.client.index({
                index: 'media',
                id: media._id.toString(),
                body: {
                    title: media.title,
                    description: media.description,
                    transcription: media.transcription?.content || '',
                    annotations: this.extractAnnotationText(media.annotations),
                    type: media.type,
                    tags: media.metadata?.tags || [],
                    metadata: media.metadata,
                    organizationId: media.organizationId,
                    tenantId: media.tenantId,
                    createdAt: media.createdAt
                }
            });
        } catch (error) {
            logger.error('Error indexing media:', error);
            throw error;
        }
    }

    /**
     * Search content
     * @param {Object} query - Search parameters
     * @returns {Promise<Object>}
     */
    async searchContent(query) {
        const {
            searchText,
            type,
            tags,
            difficulty,
            organizationId,
            tenantId,
            page = 1,
            limit = 10,
            sortBy = 'createdAt:desc'
        } = query;

        const must = [];
        if (searchText) {
            must.push({
                multi_match: {
                    query: searchText,
                    fields: ['title^3', 'description^2', 'content', 'tags'],
                    fuzziness: 'AUTO'
                }
            });
        }

        const filter = [
            { term: { organizationId } },
            { term: { tenantId } }
        ];

        if (type) filter.push({ term: { type } });
        if (tags) filter.push({ terms: { tags } });
        if (difficulty) filter.push({ term: { 'metadata.difficulty': difficulty } });

        const [field, order] = sortBy.split(':');
        const from = (page - 1) * limit;

        try {
            const result = await this.client.search({
                index: 'content',
                body: {
                    query: {
                        bool: {
                            must,
                            filter
                        }
                    },
                    sort: [
                        { [field]: { order } }
                    ],
                    from,
                    size: limit
                }
            });

            return {
                results: result.hits.hits.map(hit => ({
                    id: hit._id,
                    score: hit._score,
                    ...hit._source
                })),
                total: result.hits.total.value,
                page,
                limit
            };
        } catch (error) {
            logger.error('Error searching content:', error);
            throw error;
        }
    }

    /**
     * Search media
     * @param {Object} query - Search parameters
     * @returns {Promise<Object>}
     */
    async searchMedia(query) {
        const {
            searchText,
            type,
            tags,
            organizationId,
            tenantId,
            page = 1,
            limit = 10,
            sortBy = 'createdAt:desc'
        } = query;

        const must = [];
        if (searchText) {
            must.push({
                multi_match: {
                    query: searchText,
                    fields: ['title^3', 'description^2', 'transcription', 'annotations', 'tags'],
                    fuzziness: 'AUTO'
                }
            });
        }

        const filter = [
            { term: { organizationId } },
            { term: { tenantId } }
        ];

        if (type) filter.push({ term: { type } });
        if (tags) filter.push({ terms: { tags } });

        const [field, order] = sortBy.split(':');
        const from = (page - 1) * limit;

        try {
            const result = await this.client.search({
                index: 'media',
                body: {
                    query: {
                        bool: {
                            must,
                            filter
                        }
                    },
                    sort: [
                        { [field]: { order } }
                    ],
                    from,
                    size: limit
                }
            });

            return {
                results: result.hits.hits.map(hit => ({
                    id: hit._id,
                    score: hit._score,
                    ...hit._source
                })),
                total: result.hits.total.value,
                page,
                limit
            };
        } catch (error) {
            logger.error('Error searching media:', error);
            throw error;
        }
    }

    /**
     * Extract text content from content blocks
     * @param {Array} blocks - Content blocks
     * @returns {string}
     */
    extractContentText(blocks) {
        if (!blocks) return '';
        return blocks
            .map(block => {
                switch (block.type) {
                    case 'text':
                        return block.content.text;
                    case 'quiz':
                        return `${block.content.question} ${block.content.options.join(' ')}`;
                    default:
                        return '';
                }
            })
            .filter(Boolean)
            .join(' ');
    }

    /**
     * Extract text from annotations
     * @param {Array} annotations - Media annotations
     * @returns {string}
     */
    extractAnnotationText(annotations) {
        if (!annotations) return '';
        return annotations
            .map(annotation => annotation.content.text)
            .filter(Boolean)
            .join(' ');
    }

    /**
     * Delete document from index
     * @param {string} index - Index name
     * @param {string} id - Document ID
     * @returns {Promise<void>}
     */
    async deleteDocument(index, id) {
        try {
            await this.client.delete({
                index,
                id
            });
        } catch (error) {
            logger.error(`Error deleting document from ${index}:`, error);
            throw error;
        }
    }
}

module.exports = new SearchEngine();
