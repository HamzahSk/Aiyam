exports.run = {
   usage: ['emojimix'],
   hidden: ['mix', 'emomix'],
   use: 'emoji + emoji',
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
         if (!text) return client.reply(m.chat, Func.example(isPrefix, command, '😳+😩'), m)
         
         client.sendReact(m.chat, '🕒', m.key)

         let [emoji1, emoji2] = text.split`+`
         if (!emoji1 || !emoji2) return client.reply(m.chat, Func.texted('bold', `🚩 Kasih 2 emoji ya buat di-mix.`), m)

         const { data } = await require('axios').get(`https://tenor.googleapis.com/v2/featured`, {
            params: {
               key: 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ',
               contentfilter: 'high',
               media_filter: 'png_transparent',
               component: 'proactive',
               collection: 'emoji_kitchen_v5',
               q: `${emoji1}_${emoji2}`
            }
         })

         if (!data.results || data.results.length < 1) return client.reply(m.chat, Func.texted('bold', `🚩 Gagal nemu kombinasi buat ${emoji1}+${emoji2}`), m)

         for (let res of data.results) {
            await client.sendSticker(m.chat, res.url, m, {
               packname: exif.sk_pack,
               author: exif.sk_author,
               categories: [emoji1, emoji2]
            })
         }

      } catch (e) {
         return client.reply(m.chat, Func.texted('bold', `🚩 Error pas mix emoji.`), m)
      }
   },
   error: false,
   limit: true,
   cache: true,
   location: __filename
}