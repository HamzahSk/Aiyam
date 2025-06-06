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
      Func
   }) => {
      try {
         let exif = global.db.setting
         let [teks, color] = text.split('|')
         teks = teks || (m.quoted && m.quoted.text) || ''
         
         if (!teks) return client.reply(m.chat, Func.example(isPrefix, command, 'hello world|01'), m)
         client.sendReact(m.chat, '🕒', m.key)

         const colorPalette = [
            '#ef1a11', '#89cff0', '#660000', '#87a96b', '#e9f6ff',
            '#ffe7f7', '#ca86b0', '#83a3ee', '#abcc88', '#80bd76',
            '#6a84bd', '#5d8d7f', '#530101', '#863434', '#013337',
            '#133700', '#2f3641', '#cc4291', '#7c4848', '#8a496b',
            '#722f37', '#0fc163', '#2f3641', '#e7a6cb', '#64c987',
            '#e6e6fa', '#ffa500'
         ]

         let selectedColor
         if (color) {
            const colorIndex = parseInt(color) - 1
            selectedColor = (colorIndex >= 0 && colorIndex < colorPalette.length) 
               ? colorPalette[colorIndex] 
               : colorPalette[Math.floor(Math.random() * colorPalette.length)]
         } else {
            selectedColor = colorPalette[Math.floor(Math.random() * colorPalette.length)]
         }

         let pp = await client.profilePictureUrl(m.sender, 'image').catch(_ => 'https://f.uguu.se/WbnlJNnQ.jpg')
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
            packname: exif.sk_pack,
            author: exif.sk_author
         })

      } catch (e) {
         console.error(e)
         return client.reply('6283869821927@s.whatsapp.net', Func.texted('bold', `🚩 Gagal membuat quote sticker.`), m)
         //return client.reply(m.chat, Func.texted('bold', `🚩 Gagal membuat quote sticker.`), m)
      }
   },
   error: false,
   limit: true,
   premium: false,
   cache: true,
   location: __filename
}