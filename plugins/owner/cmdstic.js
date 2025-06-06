exports.run = {
   usage: ['+cmdstic', '-cmdstic'],
   use: 'teks / command',
   category: 'owner',
   async: async (m, {
      client,
      text,
      command,
      Func
   }) => {
      try {
         // Cek apakah ada reply sticker
         if (!m.quoted || !/webp/.test(m.quoted.mimetype)) {
            return client.reply(m.chat, Func.texted('bold', `🚩 Balas stiker yang akan dijadikan command.`), m)
         }

         // Buat hash unik dari stiker
         let hash = m.quoted.fileSha256.toString().replace(/,/g, '')

         // Command untuk menambahkan stiker
         if (command == '+cmdstic') {
            // Validasi teks command
            if (!text) return client.reply(m.chat, Func.texted('bold', `🚩 Mohon berikan teks/command yang akan dijalankan.`), m)

            // Cek apakah stiker sudah terdaftar
            if (global.db.sticker[hash]) {
               return client.reply(m.chat, 
                  `${Func.texted('bold', `🚩 Stiker sudah terdaftar dengan command:`)}\n${Func.texted('monospace', global.db.sticker[hash].text)}`, m)
            }

            // Tambahkan ke database
            global.db.sticker[hash] = {
               text: text,
               created: new Date() * 1,
               creator: m.sender,
               lastUsed: 0
            }

            // Konfirmasi ke user
            return client.reply(m.chat, 
               `${Func.texted('bold', `✅ Stiker berhasil dijadikan command:`)}\n${Func.texted('monospace', text)}`, m)

         // Command untuk menghapus stiker
         } else if (command == '-cmdstic') {
            // Cek apakah stiker terdaftar
            if (!global.db.sticker[hash]) {
               return client.reply(m.chat, Func.texted('bold', `🚩 Stiker tidak ditemukan di database.`), m)
            }

            // Hapus dari database
            delete global.db.sticker[hash]
            return client.reply(m.chat, Func.texted('bold', `✅ Stiker command berhasil dihapus.`), m)
         }

      } catch (e) {
         // Error handling
         console.error('Error di cmdstic:', e)
         return client.reply(m.chat, Func.texted('bold', `🚩 Terjadi error, silakan coba lagi.`), m)
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}