exports.run = {
   usage: ['antidelete', 'antilink', 'antivirtex', 'antitagsw', 'autosticker', 'viewonce', 'left', 'filter', 'localonly', 'welcome'],
   use: 'on / off',
   category: 'admin tools',
   async: async (m, {
      client,
      args,
      isPrefix,
      command,
      isBotAdmin,
      Func
   }) => {
      try {
         // Cari group settings di database
         let setting = global.db.groups.find(v => v.jid == m.chat)
         if (!setting) {
            setting = {
               jid: m.chat,
               antidelete: false,
               antilink: false,
               antivirtex: false,
               antitagsw: false,
               autosticker: false,
               viewonce: false,
               left: false,
               filter: false,
               localonly: false,
               welcome: false
            }
            global.db.groups.push(setting)
         }

         let type = command
         let commandName = command // Simpan nama command asli
         
         // Validasi admin bot
         if (!isBotAdmin && /antilink|antivirtex|filter|localonly|antitagsw/.test(type)) {
            return client.reply(m.chat, global.status.botAdmin, m)
         }

         // Validasi input
         if (!args || !args[0]) {
            return client.reply(m.chat, `⚙️ *${commandName} Status* : ${setting[type] ? 'ON' : 'OFF'}\nContoh: ${isPrefix + command} on/off`, m)
         }

         let option = args[0].toLowerCase()
         if (!['on', 'off'].includes(option)) {
            return client.reply(m.chat, `❌ Format salah. Gunakan:\n• ${isPrefix + command} on\n• ${isPrefix + command} off`, m)
         }

         let status = option === 'on'
         
         // Cek jika status sudah sesuai
         if (setting[type] === status) {
            return client.reply(m.chat, `⚠️ ${commandName} sudah dalam status *${option.toUpperCase()}* sebelumnya.`, m)
         }

         // Update status
         setting[type] = status
         
         // Konfirmasi dengan nama command asli
         client.reply(m.chat, `✅ *${commandName}* berhasil di *${option === 'on' ? 'nyalakan' : 'matikan'}*`, m)

      } catch (e) {
         console.error('Error:', e)
         return client.reply(m.chat, `❌ Gagal mengubah ${commandName}:\n${e.message}`, m)
      }
   },
   admin: true,
   group: true,
   cache: true,
   location: __filename
}