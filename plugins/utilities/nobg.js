exports.run = {
   usage: ['removebg'],
   hidden: ['nobg'],
   use: 'kirim / reply foto',
   category: 'utilities',
   async: async (m, { client, Func }) => {
      try {
         let q = m.quoted ? m.quoted : m
         let mime = (q.msg || q).mimetype || ''

         if (!/image\/(jpe?g|png)/.test(mime)) {
            return client.reply(m.chat, Func.texted('bold', `🚩 Kirim atau reply ke gambar dulu.`), m)
         }

         client.sendReact(m.chat, '🕒', m.key)

         let img = await q.download()
         if (!img) return client.reply(m.chat, global.status.wrong, m)

         // Upload ke Uguu.se
         let res = await Func.UguuSe(img)
         let url = res.url
         if (!url) return client.reply(m.chat, Func.texted('bold', '❌ Gagal upload ke Uguu.se.'), m)

         // Panggil API removebg yang bener
         let removebgUrl = `https://apis.davidcyriltech.my.id/removebg?url=${encodeURIComponent(url)}`
         let buffer = await Func.fetchBuffer(removebgUrl)

         if (!buffer) return client.reply(m.chat, Func.texted('bold', '❌ Gagal hapus background.'), m)

         await client.sendFile(m.chat, buffer, 'removebg.png', '✅ *Sukses hapus background!*', m)
         
         await client.sendReact(m.chat, '✅', m.key)

      } catch (e) {
         console.log(e)
         client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   error: false,
   limit: 5,
   cache: true,
   location: __filename
}