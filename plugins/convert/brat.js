exports.run = {
   usage: ['brat'],
   use: 'text',
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
         let teks = text || (m.quoted && m.quoted.text)

         if (!teks) return client.reply(m.chat, Func.example(isPrefix, command, 'aiyam bot'), m)
         if (teks.length > 60) return client.reply(m.chat, Func.texted('bold', `🚩 Max 60 karakter ya.`), m)

         client.sendReact(m.chat, '🕒', m.key)

         let url = `https://aqul-brat.hf.space/?text=${encodeURIComponent(teks)}`
         let res = await Func.fetchBuffer(url)

         if (!res) {
            // Kalo server utama down, coba server cadangan
            try {
               url = `https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(teks)}`
               res = await Func.fetchBuffer(url)
               if (!res) throw 'Gagal juga'
            } catch (err) {
               return client.reply(m.chat, Func.texted('bold', `🚩 Server Brat lagi offline semua nih.`), m)
            }
         }
         await client.sendSticker(m.chat, res, m, {
            packname: setting.sk_pack,
            author: setting.sk_author
         })

      } catch (e) {
         return client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   error: false,
   limit: true,
   cache: true,
   location: __filename
}