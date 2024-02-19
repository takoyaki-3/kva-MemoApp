// Encrypts the given text using AES-GCM with a 256-bit key.
let cryptoKey;

async function init() {
  const savedKey = localStorage.getItem('cryptoKey');
  if (savedKey) {
    const keyUint8Array = Uint8Array.from(atob(savedKey), c => c.charCodeAt(0));
    cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyUint8Array,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    document.getElementById('output').textContent = 'ブラウザから鍵を読み込みました';
  }
}

async function generateKey() {
  cryptoKey = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  const exported = await window.crypto.subtle.exportKey("raw", cryptoKey);
  const exportedKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  localStorage.setItem('cryptoKey', exportedKeyBase64);
  document.getElementById('output').textContent = '鍵が生成されました';
}

async function exportKey() {
  if (!cryptoKey) {
    document.getElementById('output').textContent = '先に鍵を生成してください';
    return;
  }
  const exported = await window.crypto.subtle.exportKey("raw", cryptoKey);
  const exportedKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  document.getElementById('output').textContent = 'エクスポートされた鍵: ' + exportedKeyBase64;
}

async function importKey() {
  const keyBase64 = prompt('インポートする鍵を入力してください');
  const keyUint8Array = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyUint8Array,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  localStorage.setItem('cryptoKey', keyBase64);
  document.getElementById('output').textContent = '鍵がインポートされました';
}

async function encrypt(text) {
  if (!cryptoKey) {
    document.getElementById('output').textContent = '先に鍵を生成またはインポートしてください';
    return;
  }
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    cryptoKey,
    new TextEncoder().encode(text)
  );
  const encryptedBuffer = new Uint8Array(encrypted);
  const encryptedBase64 = btoa(String.fromCharCode(...encryptedBuffer));
  const ivBase64 = btoa(String.fromCharCode(...iv));
  return ivBase64 + ':' + encryptedBase64;
}

async function decrypt(encryptedString) {
  if (!cryptoKey) {
    document.getElementById('output').textContent = '先に鍵を生成またはインポートしてください';
    return;
  }
  const [ivBase64, dataBase64] = encryptedString.split(':');
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(dataBase64), c => c.charCodeAt(0));
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      cryptoKey,
      data
    );
    const decryptedText = new TextDecoder().decode(decrypted);
    return decryptedText;
  } catch (e) {
    document.getElementById('output').textContent = '復号化に失敗しました';
  }
}

// call the init function when the page is loaded
window.addEventListener('load', init);
