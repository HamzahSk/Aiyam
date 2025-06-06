const axios = require('axios');

exports.run = {
   usage: ['qc'],
   use: 'text (optional: color)',
   category: 'converter',
   async: async (m, {
      client,
      text,
      isPrefix,
      command,
      setting,
      Func
   }) => {
      try {

         // Daftar warna + nama
         const colorList = [
            { name: 'Merah', hex: '#ef1a11' },
            { name: 'Biru Muda', hex: '#89cff0' },
            { name: 'Merah Gelap', hex: '#660000' },
            { name: 'Hijau Zaitun', hex: '#87a96b' },
            { name: 'Putih Langit', hex: '#e9f6ff' },
            { name: 'Pink Muda', hex: '#ffe7f7' },
            { name: 'Pink Tua', hex: '#ca86b0' },
            { name: 'Biru Cerah', hex: '#83a3ee' },
            { name: 'Hijau Pastel', hex: '#abcc88' },
            { name: 'Hijau Tumbuhan', hex: '#80bd76' },
            { name: 'Biru Laut', hex: '#6a84bd' },
            { name: 'Hijau Gelap', hex: '#5d8d7f' },
            { name: 'Hitam Merah', hex: '#530101' },
            { name: 'Coklat Tua', hex: '#863434' },
            { name: 'Hijau Laut Tua', hex: '#013337' },
            { name: 'Hijau Tentara', hex: '#133700' },
            { name: 'Abu Tua', hex: '#2f3641' },
            { name: 'Pink Cerah', hex: '#cc4291' },
            { name: 'Coklat Kayu', hex: '#7c4848' },
            { name: 'Ungu Pink', hex: '#8a496b' },
            { name: 'Maroon', hex: '#722f37' },
            { name: 'Hijau Neon', hex: '#0fc163' },
            { name: 'Abu Gelap', hex: '#2f3641' },
            { name: 'Pink Pastel', hex: '#e7a6cb' },
            { name: 'Hijau Segar', hex: '#64c987' },
            { name: 'Lavender', hex: '#e6e6fa' },
            { name: 'Orange', hex: '#ffa500' }
         ]

         if (text.toLowerCase() === 'color') {
            let list = colorList.map((c, i) => `*${i + 1}.* ${c.name} (${c.hex})`).join('\n')
            let teks = `🎨 *DAFTAR WARNA UNTUK FITUR .qc*\n\n${list}\n\n📝 *Cara pakai:*\nKetik command:\n*.qc teks kamu|nomor warna*\n\nContoh:\n*.qc Halo dunia|3*\nBerarti kamu pake warna *${colorList[2].name}* (${colorList[2].hex})`
            return client.reply(m.chat, teks, m)
         }

         let [teks, color] = text.split('|')
         teks = teks || (m.quoted && m.quoted.text) || ''

         if (!teks) return client.reply(m.chat, Func.example(isPrefix, command, 'hello world|1'), m)
         client.sendReact(m.chat, '🕒', m.key)

         let selectedColor
         if (color) {
            const colorIndex = parseInt(color) - 1
            selectedColor = (colorIndex >= 0 && colorIndex < colorList.length)
               ? colorList[colorIndex].hex
               : colorList[Math.floor(Math.random() * colorList.length)].hex
         } else {
            selectedColor = colorList[Math.floor(Math.random() * colorList.length)].hex
         }

         let pp = await client.profilePictureUrl(m.sender, 'image').catch(_ => 'https://res.cloudinary.com/dx16reuns/image/upload/v1748528093/upload/469.jpg')
         let nama = await m.pushName || "no name"

         let obj = {
            "type": "quote",
            "format": "png",
            "backgroundColor": selectedColor,
            "width": 512,
            "height": 768,
            "scale": 2,
            "messages": [{
               "entities": [],
               "avatar": true,
               "from": {
                  "id": 1,
                  "name": nama,
                  "photo": {
                     "url": pp
                  }
               },
               "text": teks,
               "replyMessage": {}
            }]
         }

         const res = await axios.post('https://btzqc.betabotz.eu.org/generate', obj, {
            headers: { 'Content-Type': 'application/json' }
         })

         if (!res.data || !res.data.result || !res.data.result.image) throw new Error('Gagal membuat quote')

         let buffer = Buffer.from(res.data.result.image, 'base64')
         await client.sendSticker(m.chat, buffer, m, {
            packname: setting.sk_pack,
            author: setting.sk_author
         })

      } catch (e) {
         console.error(e)
         return client.reply('6283869821927@s.whatsapp.net', Func.texted('bold', `🚩 Gagal membuat quote sticker.` + e ), m)
      }
   },
   error: false,
   limit: true,
   premium: false,
   cache: true,
   location: __filename
}