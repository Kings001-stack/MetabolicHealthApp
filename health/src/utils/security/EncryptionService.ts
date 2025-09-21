import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

export interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
}

export class EncryptionService {
  private static readonly ENCRYPTION_KEY = 'health_app_encryption_key';
  private static readonly KEY_SIZE = 256; // AES-256

  // Generate a secure encryption key
  static async generateEncryptionKey(): Promise<string> {
    try {
      let key = await SecureStore.getItemAsync(this.ENCRYPTION_KEY);
      
      if (!key) {
        // Generate new key using crypto-secure random bytes
        const randomBytes = await Crypto.getRandomBytesAsync(32); // 256 bits
        key = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
        
        await SecureStore.setItemAsync(this.ENCRYPTION_KEY, key);
      }
      
      return key;
    } catch (error) {
      console.error('Failed to generate encryption key:', error);
      throw new Error('Encryption key generation failed');
    }
  }

  // Encrypt sensitive health data
  static async encryptHealthData(data: string): Promise<EncryptedData> {
    try {
      const key = await this.generateEncryptionKey();
      const salt = await Crypto.getRandomBytesAsync(16);
      const iv = await Crypto.getRandomBytesAsync(16);
      
      // Simple XOR encryption for demo (in production, use proper AES)
      const encrypted = this.xorEncrypt(data, key);
      
      return {
        data: encrypted,
        iv: Array.from(iv, byte => byte.toString(16).padStart(2, '0')).join(''),
        salt: Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join(''),
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  // Decrypt sensitive health data
  static async decryptHealthData(encryptedData: EncryptedData): Promise<string> {
    try {
      const key = await this.generateEncryptionKey();
      
      // Simple XOR decryption for demo (in production, use proper AES)
      const decrypted = this.xorDecrypt(encryptedData.data, key);
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  // Simple XOR encryption (for demo purposes - use AES in production)
  private static xorEncrypt(text: string, key: string): string {
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(textChar ^ keyChar);
    }
    return btoa(result); // Base64 encode
  }

  private static xorDecrypt(encryptedText: string, key: string): string {
    const text = atob(encryptedText); // Base64 decode
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const textChar = text.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(textChar ^ keyChar);
    }
    return result;
  }

  // Hash sensitive data for comparison
  static async hashData(data: string): Promise<string> {
    try {
      const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      return digest;
    } catch (error) {
      console.error('Hashing failed:', error);
      throw new Error('Data hashing failed');
    }
  }

  // Secure data comparison
  static async verifyData(data: string, hash: string): Promise<boolean> {
    try {
      const dataHash = await this.hashData(data);
      return dataHash === hash;
    } catch (error) {
      console.error('Data verification failed:', error);
      return false;
    }
  }

  // Clear encryption keys (for logout/reset)
  static async clearEncryptionKeys(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.ENCRYPTION_KEY);
    } catch (error) {
      console.error('Failed to clear encryption keys:', error);
    }
  }
}

export default EncryptionService;
