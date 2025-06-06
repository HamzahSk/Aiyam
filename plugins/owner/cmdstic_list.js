const moment = require('moment-timezone')
moment.tz.setDefault(process.env.TZ)

exports.run = {
   usage: ['cmdstic', 'listcmdstic'],
   category: 'owner',
   async: async (m, {
      client,
      Func
   }) => {
      try {
         // Ambil semua command stiker
         const cmdStickers = Object.entries(global.db.sticker)
         
         // Jika tidak ada stiker command
         if (cmdStickers.length === 0) {
            return client.reply(m.chat, Func.texted('bold', `🚩 Belum ada stiker command terdaftar.`), m)
         }

         // Buat teks daftar
         let teks = `乂  *D A F T A R   C O M M A N D   S T I K E R*\n\n`
         teks += `Total : ${cmdStickers.length} stiker command\n\n`
         
         // Loop melalui semua stiker command
         cmdStickers.forEach(([hash, data], index) => {
            teks += `${Func.texted('bold', `${index + 1}.`)} ${hash}\n`
            teks += `   ◦  ${Func.texted('bold', 'Command')} : ${data.text}\n`
            teks += `   ◦  ${Func.texted('bold', 'Dibuat')} : ${moment(data.created).format('DD/MM/YYYY HH:mm:ss')}\n`
            teks += `   ◦  ${Func.texted('bold', 'Pembuat')} : ${data.creator ? '@' + data.creator.split('@')[0] : '-'}\n`
            teks += `   ◦  ${Func.texted('bold', 'Terakhir Dipakai')} : ${data.lastUsed ? moment(data.lastUsed).format('DD/MM/YYYY HH:mm:ss') : 'Belum pernah'}\n\n`
         })

         // Kirim hasilnya
         await client.reply(m.chat, teks + global.footer, m)

      } catch (e) {
         console.error('Error di cmdstic_list:', e)
         return client.reply(m.chat, Func.texted('bold', `🚩 Gagal menampilkan daftar stiker command.`), m)
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}