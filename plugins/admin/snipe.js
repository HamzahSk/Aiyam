const fs = require('fs')
const path = require('path')

exports.run = {
   usage: ['snipe'],
   use: '[nomor] (opsional)',
   category: 'admin tools',
   async: async (m, { client, text, Func }) => {
      const jid = m.chat
      const filePath = path.join(__dirname, '../../delete.json')

      let data = {}
      if (fs.existsSync(filePath)) {
         try {
            data = JSON.parse(fs.readFileSync(filePath))
         } catch (err) {
            console.error('Gagal baca file delete.json:', err)
         }
      }

      const snipes = data[jid]?.slice().reverse() // dibalik biar terbaru di depan
      const pic = await client.profilePictureUrl(m.sender, 'image')

      if (!snipes || snipes.length === 0) {
         return client.reply(jid, Func.texted('bold', '🚩 Belum ada pesan yang dihapus.'), m)
      }

      const index = (parseInt(text) || 1) - 1
      if (index < 0 || index >= snipes.length) {
         return client.reply(jid, Func.texted('bold', `🚩 Index snipe hanya 1 sampai ${snipes.length}`), m)
      }

      const snipe = snipes[index]
      const caption = `乂  *S N I P E - P E S A N*\n\n` +
         `◦  *Pengirim* : ${snipe.from}\n` +
         `◦  *Waktu* : ${snipe.time}\n` +
         `◦  *Pesan* : ${snipe.text}\n\n` + global.footer

      client.sendMessageModify(jid, caption, m, {
         largeThumb: true,
         thumbnail: pic ? await Func.fetchBuffer(pic) : await Func.fetchBuffer('./media/image/default.jpg')
      })
   },
   error: false,
   cache: true,
   admin: true,
   group: true,
   location: __filename
}