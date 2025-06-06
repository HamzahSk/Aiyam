const fetch = require('node-fetch') // pastiin ini udah di-import

exports.run = {
   usage: ['bratadv'],
   use: 'text|font|size|align|blur|fontColor|bgColor',
   category: 'converter',
    async: async (m, {
    text,
    client,
    Func,
    command
  }) => {
    try {
      if (!text.includes('|')) return m.reply('Format salah!\nContoh: .bratadv haloo|01|03|02|01|05')
      const exif = global.db.setting;
      const input = text.split('|')
      const content = input[0] || 'Hello World'
      const font = ['Arial', 'Times New Roman', 'Comic Sans MS', 'Verdana', 'Tahoma', 'Impact', 'Courier New', 'Georgia', 'Lucida Console', 'Trebuchet MS'][Number(input[1]) - 1] || 'Arial'
      const fontSize = 'auto'
      const fontPosition = ['left', 'right', 'center', 'justify', 'top', 'middle', 'bottom'][Number(input[2]) - 1] || 'center'
      const fontBlur = ['0', '1', '2', '3', '4', '5'][Number(input[3]) - 1] || '0'
      const fontColor = [
        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
        '#FFA500', '#800080', '#808080', '#FFFF00', '#00FFFF',
        '#FFC0CB', '#A52A2A', '#008080', '#4682B4', '#B22222'
      ][Number(input[4]) - 1] || '#000000'
      const bgColor = [
        '#FFFFFF', '#000000', '#FFD700', '#ADD8E6', '#90EE90',
        '#FFC0CB', '#2E8B57', '#F5F5DC', '#FF69B4', '#B0C4DE'
      ][Number(input[5]) - 1] || '#FFFFFF'

      const apiUrl = `https://fastrestapis.fasturl.cloud/maker/brat/advanced?text=${encodeURIComponent(content)}&font=${font}&fontSize=${fontSize}&fontPosition=${fontPosition}&fontBlur=${fontBlur}&fontColor=${fontColor}&bgColor=${bgColor}`
      const res = await fetch(apiUrl)

      if (!res.ok) return m.reply('Gagal generate gambar.')
      const buffer = await res.buffer()
      await client.sendSticker(m.chat, buffer, m, {
            packname: exif.sk_pack,
            author: exif.sk_author
         })
      } catch (e) {
      console.log(e)
      m.reply('Error bang!')
    }
  },
  error: true,
  limit: true,
  premium: true
}