exports.run = {
   usage: ['hapusjadwal', 'listjadwal'],
   use: '(index | all)',
   category: 'admin tools',
   async: async (m, { client, text, isPrefix, command, Func }) => {
      try {
         let gc = global.db.groups.find(v => v.jid === m.chat)

         if (!gc) return m.reply('❌ Data grup nggak ditemukan.')
         if (!gc.jadwal) gc.jadwal = []

         if (command == 'hapusjadwal') {
            if (!text) return m.reply(`Masukin index atau ketik *all* buat hapus semua!\nContoh:\n• *${isPrefix}hapusjadwal 1*\n• *${isPrefix}hapusjadwal all*`)

            if (text.toLowerCase() === 'all') {
               const total = gc.jadwal.length
               gc.jadwal = []
               delete gc.lastExec
               return m.reply(`✅ Semua *${total} jadwal* berhasil dihapus dan *lastExec* juga udah dibersihin!`)
            }

            const index = parseInt(text) - 1
            if (isNaN(index)) return m.reply(`Index nggak valid!\nContoh: *${isPrefix}hapusjadwal 2*`)
            if (!gc.jadwal[index]) return m.reply('⚠️ Index nggak ditemukan di list jadwal.')

            const deleted = gc.jadwal.splice(index, 1)
            return m.reply(`✅ Jadwal *${deleted[0].action.toUpperCase()} jam ${deleted[0].time}* berhasil dihapus!`)
         }

         if (command == 'listjadwal') {
            if (gc.jadwal.length === 0) return m.reply('📭 Belum ada jadwal yang disimpan buat grup ini.')

            let teks = '*📅 Daftar Jadwal Grup:*\n\n'
            gc.jadwal.forEach((j, i) => {
               teks += `*${i + 1}.* ${j.action === 'open' ? '🔓 Buka' : '🔒 Tutup'} jam *${j.time}*\n`
            })
            return m.reply(teks.trim())
         }
      } catch (e) {
         client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   admin: true,
   group: true,
   botAdmin: true
}