/**
 * Gerador de PIX Copia e Cola (BR Code / EMV)
 */
function tlv(id, value) { const len = String(value.length).padStart(2, '0'); return `${id}${len}${value}` }
function crc16(str) {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) { crc ^= str.charCodeAt(i) << 8; for (let j = 0; j < 8; j++) { if (crc & 0x8000) crc = (crc << 1) ^ 0x1021; else crc = crc << 1 } crc &= 0xFFFF }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}
function gerarPixCopiaCola({ chave, nome, cidade, valor, txid }) {
  const nomeClean = (nome || 'FOGAO A LENHA LENINHA').normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25).toUpperCase()
  const cidadeClean = (cidade || 'VISCONDE RIO BRANCO').normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 15).toUpperCase()
  const valorStr = Number(valor).toFixed(2)
  const txidStr = (txid || '***').substring(0, 25)
  const gui = tlv('00', 'BR.GOV.BCB.PIX')
  const chaveField = tlv('01', chave)
  const merchantAccount = tlv('26', gui + chaveField)
  let payload = ''
  payload += tlv('00', '01') + tlv('01', '12') + merchantAccount + tlv('52', '0000') + tlv('53', '986')
  if (valor > 0) payload += tlv('54', valorStr)
  payload += tlv('58', 'BR') + tlv('59', nomeClean) + tlv('60', cidadeClean) + tlv('62', tlv('05', txidStr)) + '6304'
  return payload + crc16(payload)
}
module.exports = { gerarPixCopiaCola }
