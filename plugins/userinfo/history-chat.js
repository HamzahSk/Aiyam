exports.run = {
   usage: ['history'],
   use: '[jumlah] (opsional)',
   category: 'tools',
   async: async (m, { client, text, ctx, StoreR, Func }) => {
      const jid = m.chat
      const jumlah = parseInt(text) || 5
      const messages = StoreR?.messages?.[jid]
       var pic = await client.profilePictureUrl(m.sender, 'image')
      if (!messages || messages.length === 0) {
         return client.reply(jid, Func.texted('bold', '🚩 Belum ada pesan yang ke-store.'), m)
      }

      // Ambil pesan terakhir sebanyak `jumlah`
      const list = messages.slice(-jumlah).map((msg, i) => {
         return `*${i + 1}*. ${msg.text || '[Pesan tanpa teks]'}`
      }).join('\n')

      const caption = `乂  *H I S T O R Y - P E S A N*\n\n${list}\n\n` + global.footer
      client.sendMessageModify(jid, caption, m, { largeThumb: true,
            thumbnail: pic ? await Func.fetchBuffer(pic) : await Func.fetchBuffer('./media/image/default.jpg')
      })
   },
   error: false,
   cache: true,
   location: __filename
}