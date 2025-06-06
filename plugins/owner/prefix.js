exports.run = {
   usage: ['prefix', 'tambahprefix', 'hapusprefix'],
   hidden: ['+prefix', '-prefix'],
   use: 'simbol',
   category: 'owner',
   async: async (m, {
      client,
      args,
      isPrefix,
      command,
      Func,
      env
   }) => {
      try {
         const system = global.db.setting
         const prefixInput = args[0]
         const forbiddenChars = env.evaluate_chars || ['/', '@', '#', '$', '%', '^', '&', '*']

         // Validasi input kosong
         if (!prefixInput) {
            const currentPrefixes = system.prefix.join(', ')
            return client.reply(m.chat, 
               Func.example(isPrefix, command, '#') + 
               `\n\nPrefix saat ini: ${currentPrefixes}\n` +
               `Karakter terlarang: ${forbiddenChars.join(' ')}`, 
               m
            )
         }

         // Validasi panjang prefix
         if (prefixInput.length > 1) {
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 Mohon gunakan hanya 1 karakter untuk prefix.'), 
               m
            )
         }

         // Validasi karakter terlarang
         if (forbiddenChars.includes(prefixInput)) {
            return client.reply(m.chat, 
               Func.texted('bold', `🚩 Karakter "${prefixInput}" tidak dapat digunakan sebagai prefix karena dapat menyebabkan error.`), 
               m
            )
         }

         // Command: Set prefix utama
         if (command === 'prefix') {
            if (prefixInput === system.onlyprefix) {
               return client.reply(m.chat, 
                  Func.texted('bold', `ℹ️ Prefix "${prefixInput}" sudah digunakan sebagai prefix utama.`), 
                  m
               )
            }
            
            system.onlyprefix = prefixInput
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil mengubah prefix utama menjadi: "${prefixInput}"`), 
               m
            )

         // Command: Tambah prefix alternatif
         } else if (command === '+prefix' || command === 'tambahprefix') {
            if (system.prefix.includes(prefixInput)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `⚠️ Prefix "${prefixInput}" sudah ada dalam daftar prefix.`), 
                  m
               )
            }
            
            system.prefix.push(prefixInput)
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil menambahkan prefix alternatif "${prefixInput}"`), 
               m
            )

         // Command: Hapus prefix alternatif
         } else if (command === '-prefix' || command === 'hapusprefix') {
            if (system.prefix.length <= 1) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Tidak bisa menghapus semua prefix, minimal harus ada 1 prefix yang aktif.'), 
                  m
               )
            }
            
            if (!system.prefix.includes(prefixInput)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `🚩 Prefix "${prefixInput}" tidak ditemukan dalam daftar.`), 
                  m
               )
            }
            
            system.prefix = system.prefix.filter(p => p !== prefixInput)
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil menghapus prefix "${prefixInput}"`), 
               m
            )
         }
      } catch (e) {
         console.error('Error pada prefix manager:', e)
         return client.reply(m.chat, 
            Func.texted('bold', '🚩 Terjadi kesalahan saat memproses perubahan prefix.'), 
            m
         )
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}