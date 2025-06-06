exports.run = {
   usage: ['aktifkanplugin', 'nonaktifkanplugin'],
   hidden: ['plugen', 'plugdis'],
   use: 'nama plugin',
   category: 'owner',
   async: async (m, {
      client,
      args,
      isPrefix,
      command,
      plugins: plugs,
      Func
   }) => {
      try {
         // Validasi input
         if (!args || !args[0]) {
            const examplePlugin = Object.keys(plugs).length > 0 ? Object.keys(plugs)[0] : 'contoh'
            return client.reply(m.chat, 
               Func.example(isPrefix, command, examplePlugin) + 
               '\n\nDaftar plugin tersedia: ' + Object.keys(plugs).join(', '), 
               m
            )
         }

         const pluginName = args[0]
         const pluginDisable = global.db.setting.pluginDisable

         // Command untuk menonaktifkan plugin
         if (command === 'plugdis' || command === 'nonaktifkanplugin') {
            // Cek apakah plugin ada
            if (!plugs[pluginName]) {
               return client.reply(m.chat, 
                  Func.texted('bold', `🚩 Plugin ${pluginName}.js tidak ditemukan.`), 
                  m
               )
            }

            // Cek apakah sudah dinonaktifkan
            if (pluginDisable.includes(pluginName)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `⚠️ Plugin ${pluginName}.js sudah dinonaktifkan sebelumnya.`), 
                  m
               )
            }

            // Nonaktifkan plugin
            pluginDisable.push(pluginName)
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil menonaktifkan plugin ${pluginName}.js`), 
               m
            )

         // Command untuk mengaktifkan plugin
         } else if (command === 'plugen' || command === 'aktifkanplugin') {
            // Cek apakah plugin ada di daftar nonaktif
            if (!pluginDisable.includes(pluginName)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `ℹ️ Plugin ${pluginName}.js tidak dalam daftar nonaktif.`), 
                  m
               )
            }

            // Aktifkan kembali plugin
            const index = pluginDisable.indexOf(pluginName)
            if (index > -1) {
               pluginDisable.splice(index, 1)
            }

            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil mengaktifkan plugin ${pluginName}.js`), 
               m
            )
         }
      } catch (e) {
         console.error('Error pada plugin manager:', e)
         return client.reply(m.chat, 
            Func.texted('bold', '🚩 Gagal memproses perintah plugin. Silakan coba lagi.'), 
            m
         )
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}