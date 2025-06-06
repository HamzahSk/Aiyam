exports.run = {
   usage: ['restart'],
   hidden: ['resetbot', 'reboot'],
   category: 'owner',
   async: async (m, {
      client,
      args,
      command,
      setting,
      env,
      Func,
      database
   }) => {
      try {
         const sender = m.sender
         
         // Cek dan simpan status pemakaian pertama kali di global.db.users
         let ownerData = global.db.users.find(u => u.jid === sender)
         if (!ownerData) {
            ownerData = {
               jid: sender,
               premium: true,
               firstcommand: { hasUsedRestart: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedRestart === 'undefined') {
               ownerData.firstcommand.hasUsedRestart = false
            }
         }

         // Tampilkan tutorial jika pertama kali menggunakan command
         if (!ownerData.firstcommand.hasUsedRestart) {
            const tutorial = `
📢 *Panduan Penggunaan .restart*

Command ini digunakan untuk merestart bot sepenuhnya.
• Bot akan mati sementara selama 5-10 detik
• Semua database akan disimpan otomatis
• Proses ini hanya untuk owner bot

⚠️ *PERINGATAN*:
1. Jangan mengirim command selama proses restart
2. Pastikan tidak ada proses penting yang sedang berjalan
3. Restart bisa memakan waktu hingga 15 detik di kondisi tertentu
            `
            await client.reply(m.chat, tutorial.trim(), m)
            ownerData.firstcommand.hasUsedRestart = true
         }

         // Kirim pesan notifikasi restart
         const restartMessage = `
🔄 *PROSES RESTART DIMULAI*

• Menyimpan database...
• Memulai ulang sistem...
• Estimasi: 5-10 detik

_Jangan mengirim command selama proses restart_
         `.trim()

         await client.reply(m.chat, Func.texted('bold', restartMessage), m)

         // Simpan database sebelum restart
         await database.save(global.db)
            .then(() => console.log('[RESTART] Database berhasil disimpan'))
            .catch(e => console.error('[RESTART] Gagal menyimpan database:', e))

         // Catat log restart dengan waktu lokal
         const jakartaTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone })
         
         // Simpan histori restart ke database
         const logRestart = env.log_restart || 50 // Default 50 log terakhir
         if (!global.db.Logs) global.db.Logs = {}
         if (!global.db.Logs.restart) global.db.Logs.restart = []
         
         global.db.Logs.restart.push({
            date: jakartaTime,
            by: sender
         })
         
         // Rotasi log jika melebihi batas
         if (global.db.Logs.restart.length > logRestart) {
            global.db.Logs.restart.shift()
         }

         console.log(`[RESTART] Diinisiasi oleh ${sender} pada ${jakartaTime}`)

         // Kirim sinyal restart ke proses utama
         process.send('reset')

      } catch (e) {
         console.error('[RESTART ERROR]', e)
         await client.reply(m.chat, 
            Func.texted('bold', '🚩 Gagal melakukan restart. Silakan coba lagi atau restart manual.'), 
            m
         )
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}