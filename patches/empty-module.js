// Polyfill vacío para el módulo crypto de Node.js
// Esto evita que axios intente importar crypto en React Native
// ya que crypto no está disponible en el runtime de React Native

module.exports = {
  randomBytes: () => {},
  createHash: () => ({
    update: () => ({ digest: () => Promise.resolve(Buffer.from('')) }),
  }),
  createHmac: () => ({
    update: () => ({ digest: () => Promise.resolve(Buffer.from('')) }),
  }),
  timingSafeEqual: () => false,
  randomFill: () => {},
  randomFillSync: () => {},
  createCipher: () => ({}),
  createDecipher: () => ({}),
  createCredentials: () => ({}),
  constants: {},
  DEFAULT_ENCODING: 'utf8',
  getCiphers: () => [],
  listCiphers: () => [],
  createECDH: () => ({}),
  getDiffieHellman: () => ({}),
  createSign: () => ({}),
  createVerify: () => ({}),
  createDiffieHellman: () => ({}),
  publicEncrypt: () => Buffer.from(''),
  privateDecrypt: () => Buffer.from(''),
  randomUUID: () => '00000000-0000-0000-0000-000000000000',
};
