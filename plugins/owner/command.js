exports.run = {
   usage: ['aktifkan', 'nonaktifkan'],
   hidden: ['disable', 'enable'],
   use: 'command',
   category: 'owner',
   async: async (m, {
      client,
      args,
      isPrefix,
      command,
      plugins,
      Func
   }) => {
      try {
         // Validasi input command
         if (!args || !args[0]) {
            return client.reply(m.chat, 
               Func.example(isPrefix, command, 'contoh_command'), 
               m
            )
         }

         // Dapatkan daftar command yang tersedia
         const availableCommands = Object.values(plugins)
            .filter(plugin => plugin.run && plugin.run.usage)
            .flatMap(plugin => plugin.run.usage)

         // Cek apakah command ada
         if (!availableCommands.includes(args[0])) {
            return client.reply(m.chat, 
               Func.texted('bold', `🚩 Command ${isPrefix + args[0]} tidak ditemukan.`), 
               m
            )
         }

         const cmdSettings = global.db.setting
         const commandName = args[0]

         // Command disable/nonaktifkan
         if (command === 'disable' || command === 'nonaktifkan') {
            if (cmdSettings.error.includes(commandName)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `⚠️ Command ${isPrefix + commandName} sudah dinonaktifkan sebelumnya.`), 
                  m
               )
            }
            
            cmdSettings.error.push(commandName)
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil menonaktifkan command ${isPrefix + commandName}`), 
               m
            )

         // Command enable/aktifkan
         } else if (command === 'enable' || command === 'aktifkan') {
            if (!cmdSettings.error.includes(commandName)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `ℹ️ Command ${isPrefix + commandName} sudah aktif.`), 
                  m
               )
            }
            
            const index = cmdSettings.error.indexOf(commandName)
            if (index > -1) {
               cmdSettings.error.splice(index, 1)
            }
            
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil mengaktifkan command ${isPrefix + commandName}`), 
               m
            )
         }
      } catch (e) {
         console.error('Error pada command enable/disable:', e)
         return client.reply(m.chat, 
            Func.texted('bold', '🚩 Terjadi kesalahan saat memproses command.'), 
            m
         )
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}