exports.run = {
   usage: ['jadwal'],
   use: 'open/close <jam>',
   category: 'admin tools',
   async: async (m, {
      client,
      text,
      command
   }) => {
      let gc = global.db.groups.find(v => v.jid === m.chat)
      const teks = text.split(' ')

      if (teks.length < 2) return m.reply('Format salah!\nContoh: *.jadwal open 06:00*')

      const [action, time] = teks
      if (!['open', 'close'].includes(action)) return m.reply('Aksi harus "open" atau "close".')
      if (!/^\d{2}:\d{2}$/.test(time)) return m.reply('Format waktu salah! Pakai format HH:mm, contoh: 06:00')

      // Simpan ke database group
      if (!gc) {
         gc = { jid: m.chat, jadwal: [] }
         global.db.groups.push(gc)
      }

      if (!gc.jadwal) gc.jadwal = []

      gc.jadwal.push({ action, time })

      m.reply(`Sukses menjadwalkan untuk *${action === 'open' ? 'membuka' : 'menutup'}* grup jam *${time} WIB*`)
   },
   admin: true,
   group: true,
   botAdmin: true
}