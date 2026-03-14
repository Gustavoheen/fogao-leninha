// Formata os campos separados em string de exibição
export function formatarEndereco(obj) {
  const partes = []
  if (obj?.rua) partes.push(obj.rua)
  if (obj?.numero) partes.push(`nº ${obj.numero}`)
  if (obj?.bairro) partes.push(obj.bairro)
  if (obj?.referencia) partes.push(`(${obj.referencia})`)
  return partes.join(', ')
}

export const ENDERECO_VAZIO = { rua: '', bairro: '', numero: '', referencia: '' }
