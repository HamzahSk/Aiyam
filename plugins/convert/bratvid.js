exports.run = {
   usage: ['bratvid', 'bratvideo'],
   use: 'text',
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
         let teks = text || (m.quoted && m.quoted.text)

         if (!teks) return client.reply(m.chat, Func.example(isPrefix, command, "ya hallo"), m)
         client.sendReact(m.chat, '🕒', m.key)

         let url = `https://fastrestapis.fasturl.cloud/maker/brat/animated?text=${encodeURIComponent(teks)}&mode=animated`
         let res = await Func.fetchBuffer(url)

         if (!res) {
            return client.reply(m.chat, Func.texted('bold', `🚩 Server Brat Video lagi offline.`), m)
         }
         await client.sendSticker(m.chat, res, m, {
            packname: exif.sk_pack,
            author: exif.sk_author
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