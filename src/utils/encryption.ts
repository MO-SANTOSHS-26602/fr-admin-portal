import CryptoJS from "crypto-js";

export const encryptionCode = (value: string) => {
  const data = "8080808080808080";

  const key = CryptoJS.enc.Utf8.parse(data);

  const iv = CryptoJS.enc.Utf8.parse(data);

  const response = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(value), key, {
    keySize: 128 / 8,
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  return response;
};

export const decryptionCode = (value: string) => {
  const data = "8080808080808080";

  const key = CryptoJS.enc.Utf8.parse(data);

  const iv = CryptoJS.enc.Utf8.parse(data);

  const response = CryptoJS.AES.decrypt(value, key, {
    keySize: 128 / 8,
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return JSON.parse(response.toString(CryptoJS.enc.Utf8));
};
