import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

function getEncryptionKey(): Buffer {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY
  if (!keyHex) {
    throw new Error(
      '[encryption] TOKEN_ENCRYPTION_KEY não está definida. ' +
      'Gere uma chave com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }
  if (keyHex.length !== 64) {
    throw new Error(
      '[encryption] TOKEN_ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes). ' +
      `Recebido: ${keyHex.length} caracteres.`
    )
  }
  return Buffer.from(keyHex, 'hex')
}

/**
 * Criptografa um texto usando AES-256-GCM.
 * @returns string no formato "iv_hex:authTag_hex:encrypted_hex"
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12) // 96 bits para GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':')
}

/**
 * Descriptografa um texto previamente criptografado com `encrypt`.
 * @param encryptedText string no formato "iv_hex:authTag_hex:encrypted_hex"
 * @returns texto original
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey()
  const parts = encryptedText.split(':')

  if (parts.length !== 3) {
    throw new Error('[encryption] Formato inválido: esperado "iv:authTag:encrypted"')
  }

  const [ivHex, authTagHex, encryptedHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encryptedData = Buffer.from(encryptedHex, 'hex')

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])
  return decrypted.toString('utf8')
}
