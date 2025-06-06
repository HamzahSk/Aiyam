exports.run = {
   usage: ['+sembunyi', '-sembunyi'],
   hidden: ['+hide', '-hide'],
   category: 'owner',
   async: async (m, {
      client,
      text,
      prefix,
      command,
      setting,
      ctx,
      Func
   }) => {
      try {
         // Dapatkan semua kategori yang tersedia
         const categories = [...new Set(
            Object.values(ctx.plugins)
               .filter(plugin => plugin.run && plugin.run.category)
               .map(plugin => plugin.run.category.toLowerCase())
         )]

         // Validasi input
         if (!text) {
            const example = categories.length > 0 ? categories[0] : 'download'
            return client.reply(m.chat, 
               Func.example(prefix, command, example) + 
               '\n\nDaftar kategori: ' + categories.join(', '), 
               m
            )
         }

         const categoryName = text.toLowerCase().trim()
         
         // Cek apakah kategori ada
         if (!categories.includes(categoryName)) {
            return client.reply(m.chat, 
               Func.texted('bold', `🚩 Kategori "${text}" tidak ditemukan.\n\nKategori yang tersedia: ${categories.join(', ')}`), 
               m
            )
         }

         // Command untuk menyembunyikan kategori
         if (command === '+hide' || command === '+sembunyi') {
            if (setting.hidden.includes(categoryName)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `⚠️ Kategori "${text}" sudah disembunyikan sebelumnya.`), 
                  m
               )
            }
            
            setting.hidden.push(categoryName)
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil menyembunyikan kategori "${text}"`), 
               m
            )

         // Command untuk menampilkan kategori
         } else if (command === '-hide' || command === '-sembunyi') {
            if (!setting.hidden.includes(categoryName)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `ℹ️ Kategori "${text}" tidak dalam daftar tersembunyi.`), 
                  m
               )
            }
            
            const index = setting.hidden.indexOf(categoryName)
            if (index > -1) {
               setting.hidden.splice(index, 1)
            }
            
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil menampilkan kembali kategori "${text}"`), 
               m
            )
         }
      } catch (e) {
         console.error('Error pada hide category:', e)
         return client.reply(m.chat, 
            Func.texted('bold', '🚩 Gagal memproses perintah. Silakan coba lagi.'), 
            m
         )
      }
   },
   owner: true,
   cache: true,
   location: __filename
}