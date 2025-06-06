exports.run = {
   usage: ['changename'],
   use: 'teks',
   category: 'owner',
   async: async (m, {
      client,
      text,
      isPrefix,
      command,
      Func,
      database
   }) => {
      try {
         // Validasi input
         if (!text) {
            const example = `Contoh: ${isPrefix + command} Aiyam Bot`
            return client.reply(m.chat, `❌ Mohon berikan nama baru untuk bot.\n\n${example}`, m)
         }

         // Validasi panjang nama
         const MAX_NAME_LENGTH = 25
         if (text.length > MAX_NAME_LENGTH) {
            return client.reply(m.chat, 
               `❌ Nama terlalu panjang!\nMaksimal ${MAX_NAME_LENGTH} karakter.\n\n` +
               `Anda memasukkan ${text.length} karakter.`, 
               m
            )
         }

         // Tampilkan indikator proses
         await client.sendReact(m.chat, '⏳', m.key)

         // Update nama bot
         const oldName = client.authState.creds.me?.name || 'Bot'
         client.authState.creds.me.name = text.trim()
         
         // Simpan perubahan ke database
         await database.save()

         // Format pesan sukses
         const successMessage = `✨ *NAMA BOT BERHASIL DIUBAH*\n\n` +
                               `➤ Nama Lama: ${oldName}\n` +
                               `➤ Nama Baru: ${text}\n\n` +
                               `Perubahan akan berlaku di seluruh fitur bot.`

         return client.reply(m.chat, successMessage, m)

      } catch (err) {
         console.error('ChangeName Error:', err)
         return client.reply(m.chat, 
            `❌ *GAGAL MENGUBAH NAMA*\n\n` +
            `Error: ${err.message}\n\n` +
            `Silakan coba lagi atau periksa log sistem.`, 
            m
         )
      }
   },
   owner: true
}