const crypto = require('crypto');
const zlib = require('zlib');
const util = require('util');
const { promisify } = util;
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);
const lz4 = require('lz4');
const snappy = require('snappy');

class BackupCrypto {
  constructor() {
    this.algorithms = {
      'aes-256-gcm': {
        keyLength: 32,
        ivLength: 12,
        tagLength: 16
      },
      'aes-256-cbc': {
        keyLength: 32,
        ivLength: 16,
        tagLength: 0
      },
      'chacha20-poly1305': {
        keyLength: 32,
        ivLength: 12,
        tagLength: 16
      },
      'camellia-256-gcm': {
        keyLength: 32,
        ivLength: 12,
        tagLength: 16
      },
      'aria-256-gcm': {
        keyLength: 32,
        ivLength: 12,
        tagLength: 16
      }
    };
    this.defaultAlgorithm = 'aes-256-gcm';
    this.saltLength = 16;
    this.iterations = 100000;
  }

  async deriveKey(password, salt, algorithm = 'pbkdf2', options = {}) {
    const {
      iterations = this.iterations,
      memory = 65536,
      parallelism = 4
    } = options;

    if (algorithm === 'pbkdf2') {
      return new Promise((resolve, reject) => {
        crypto.pbkdf2(
          password,
          salt,
          iterations,
          this.algorithms[this.defaultAlgorithm].keyLength,
          'sha512',
          (err, key) => {
            if (err) reject(err);
            else resolve(key);
          }
        );
      });
    } else if (algorithm === 'argon2') {
      const argon2 = require('argon2');
      const key = await argon2.hash(password, {
        salt,
        type: argon2.argon2id,
        memoryCost: memory,
        timeCost: iterations,
        parallelism
      });
      return Buffer.from(key);
    } else if (algorithm === 'scrypt') {
      return new Promise((resolve, reject) => {
        crypto.scrypt(
          password,
          salt,
          this.algorithms[this.defaultAlgorithm].keyLength,
          {
            N: memory,
            r: 8,
            p: parallelism
          },
          (err, key) => {
            if (err) reject(err);
            else resolve(key);
          }
        );
      });
    }
    throw new Error('Unsupported key derivation algorithm');
  }

  async encrypt(data, password, options = {}) {
    const {
      algorithm = this.defaultAlgorithm,
      keyDerivation = 'pbkdf2',
      keyDerivationOptions = {}
    } = options;

    if (!this.algorithms[algorithm]) {
      throw new Error('Unsupported encryption algorithm');
    }

    const { keyLength, ivLength, tagLength } = this.algorithms[algorithm];
    const salt = crypto.randomBytes(this.saltLength);
    const iv = crypto.randomBytes(ivLength);
    const key = await this.deriveKey(password, salt, keyDerivation, keyDerivationOptions);

    let cipher, encrypted, tag;
    if (algorithm.endsWith('-gcm')) {
      cipher = crypto.createCipheriv(algorithm, key, iv);
      encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      tag = cipher.getAuthTag();
    } else if (algorithm === 'chacha20-poly1305') {
      const chacha = require('chacha20-poly1305-aead');
      encrypted = chacha.encrypt(key, iv, data);
      tag = encrypted.slice(-16);
      encrypted = encrypted.slice(0, -16);
    } else {
      cipher = crypto.createCipheriv(algorithm, key, iv);
      encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
      tag = Buffer.alloc(0);
    }

    // Add metadata
    const metadata = Buffer.from(JSON.stringify({
      algorithm,
      keyDerivation,
      keyDerivationOptions
    }));
    const metadataLength = Buffer.alloc(2);
    metadataLength.writeUInt16BE(metadata.length);

    return Buffer.concat([
      metadataLength,
      metadata,
      salt,
      iv,
      tag,
      encrypted
    ]);
  }

  async decrypt(data, password) {
    // Extract metadata
    const metadataLength = data.readUInt16BE(0);
    const metadata = JSON.parse(
      data.slice(2, 2 + metadataLength).toString()
    );
    let offset = 2 + metadataLength;

    if (!this.algorithms[metadata.algorithm]) {
      throw new Error('Unsupported encryption algorithm');
    }

    const { keyLength, ivLength, tagLength } = this.algorithms[metadata.algorithm];
    const salt = data.slice(offset, offset + this.saltLength);
    offset += this.saltLength;
    const iv = data.slice(offset, offset + ivLength);
    offset += ivLength;
    const tag = tagLength ? data.slice(offset, offset + tagLength) : Buffer.alloc(0);
    offset += tagLength;
    const encrypted = data.slice(offset);

    const key = await this.deriveKey(
      password,
      salt,
      metadata.keyDerivation,
      metadata.keyDerivationOptions
    );

    let decrypted;
    if (metadata.algorithm.endsWith('-gcm')) {
      const decipher = crypto.createDecipheriv(metadata.algorithm, key, iv);
      decipher.setAuthTag(tag);
      decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    } else if (metadata.algorithm === 'chacha20-poly1305') {
      const chacha = require('chacha20-poly1305-aead');
      decrypted = chacha.decrypt(key, iv, Buffer.concat([encrypted, tag]));
    } else {
      const decipher = crypto.createDecipheriv(metadata.algorithm, key, iv);
      decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }

    return decrypted;
  }
}

class BackupCompression {
  constructor() {
    this.algorithms = {
      gzip: {
        compress: this.gzipCompress.bind(this),
        decompress: this.gzipDecompress.bind(this)
      },
      brotli: {
        compress: this.brotliCompress.bind(this),
        decompress: this.brotliDecompress.bind(this)
      },
      deflate: {
        compress: this.deflateCompress.bind(this),
        decompress: this.deflateDecompress.bind(this)
      },
      lz4: {
        compress: this.lz4Compress.bind(this),
        decompress: this.lz4Decompress.bind(this)
      },
      snappy: {
        compress: this.snappyCompress.bind(this),
        decompress: this.snappyDecompress.bind(this)
      }
    };
  }

  async compress(data, options = {}) {
    const {
      algorithm = 'gzip',
      level = 6,
      dictionary = null
    } = options;

    if (!this.algorithms[algorithm]) {
      throw new Error('Unsupported compression algorithm');
    }

    // Add metadata
    const metadata = Buffer.from(JSON.stringify({ algorithm, level }));
    const metadataLength = Buffer.alloc(2);
    metadataLength.writeUInt16BE(metadata.length);

    const compressed = await this.algorithms[algorithm].compress(data, {
      level,
      dictionary
    });

    return Buffer.concat([metadataLength, metadata, compressed]);
  }

  async decompress(data) {
    // Extract metadata
    const metadataLength = data.readUInt16BE(0);
    const metadata = JSON.parse(
      data.slice(2, 2 + metadataLength).toString()
    );
    const compressed = data.slice(2 + metadataLength);

    if (!this.algorithms[metadata.algorithm]) {
      throw new Error('Unsupported compression algorithm');
    }

    return this.algorithms[metadata.algorithm].decompress(compressed, {
      level: metadata.level
    });
  }

  // Compression implementations
  async gzipCompress(data, options) {
    return gzip(data, options);
  }

  async gzipDecompress(data) {
    return gunzip(data);
  }

  async brotliCompress(data, options) {
    return brotliCompress(data, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: options.level
      }
    });
  }

  async brotliDecompress(data) {
    return brotliDecompress(data);
  }

  async deflateCompress(data, options) {
    return deflate(data, options);
  }

  async deflateDecompress(data) {
    return inflate(data);
  }

  async lz4Compress(data, options) {
    return new Promise((resolve, reject) => {
      try {
        const compressed = lz4.encode(data, {
          compression: options.level
        });
        resolve(compressed);
      } catch (error) {
        reject(error);
      }
    });
  }

  async lz4Decompress(data) {
    return new Promise((resolve, reject) => {
      try {
        const decompressed = lz4.decode(data);
        resolve(decompressed);
      } catch (error) {
        reject(error);
      }
    });
  }

  async snappyCompress(data) {
    return snappy.compress(data);
  }

  async snappyDecompress(data) {
    return snappy.uncompress(data);
  }
}

class BackupVerification {
  constructor() {
    this.defaultAlgorithm = 'sha256';
  }

  async generateChecksum(data, algorithm = this.defaultAlgorithm) {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  async verify(data, checksum, algorithm = this.defaultAlgorithm) {
    const calculatedChecksum = await this.generateChecksum(data, algorithm);
    return calculatedChecksum === checksum;
  }

  async validateBackupStructure(backup) {
    const requiredFields = ['id', 'timestamp', 'organizationId', 'data', 'metadata'];
    for (const field of requiredFields) {
      if (!backup[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (!backup.data.organization) {
      throw new Error('Missing organization data');
    }

    return true;
  }

  async validateRestoreCompatibility(backup, currentVersion) {
    const backupVersion = backup.metadata.version;
    // Implement version compatibility check
    return true;
  }

  async validateDataIntegrity(backup) {
    // Implement data integrity validation
    return true;
  }

  async generateManifest(backup) {
    return {
      id: backup.id,
      timestamp: backup.timestamp,
      organizationId: backup.organizationId,
      checksum: await this.generateChecksum(JSON.stringify(backup.data)),
      metadata: {
        version: backup.metadata.version,
        type: backup.metadata.type,
        compressionAlgorithm: backup.metadata.compression?.algorithm,
        encryptionAlgorithm: backup.metadata.encryption?.algorithm,
        size: Buffer.byteLength(JSON.stringify(backup.data))
      }
    };
  }
}

module.exports = {
  BackupCrypto,
  BackupCompression,
  BackupVerification
};
