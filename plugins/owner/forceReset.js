exports.run = {
   usage: ['resetlimit'],
   hidden: ['reset'],
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
         const resetValue = args[0] && !isNaN(args[0]) ? parseInt(args[0]) : env.limit
         const forceReset = args.includes('--force')

         // Cek dan simpan status pemakaian pertama kali di global.db.users
         let ownerData = global.db.users.find(u => u.jid === sender)         
         if (!ownerData) {
            ownerData = {
                 jid: sender,
                 limit: env.limit,
                 premium: true,
                 firstcommand: { hasUsedResetLimit: false }
            }
         global.db.users.push(ownerData)
        } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedResetLimit === 'undefined') {
                ownerData.firstcommand.hasUsedResetLimit = false
            }
        }

         if (!ownerData.firstcommand.hasUsedResetLimit) {
            const tutorial = `
📢 *Panduan Penggunaan .resetlimit*

Command ini digunakan buat reset limit semua user *non-premium*.
• Default reset cuma buat user yg limit-nya di bawah default.
• Gunakan *--force* kalo mau reset SEMUA user free tanpa pengecualian.
Contoh:
.resetlimit 50 —> Reset user free yg limit-nya < 50 jadi 50.
.resetlimit 50 --force —> Reset semua user free jadi 50.

⚠️ Catatan: Data histori akan disimpan otomatis.
            `
            await client.reply(m.chat, tutorial.trim(), m)
            ownerData.firstcommand.hasUsedResetLimit = true
         }

         const freeUsers = global.db.users.filter(user => {
            if (!user) return false
            if (user.premium) return false
            if (forceReset) return true
            return user.limit < env.limit
         })

         const totalReset = freeUsers.length

         freeUsers.forEach(user => {
            user.limit = resetValue
         })

         // Waktu reset pakai Asia/Jakarta
         const jakartaTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone })
         setting.lastReset = new Date().getTime()

         // Simpan histori reset ke database
         const logLimit = env.log_limit
         if (!global.db.Logs) global.db.Logs = {}
         if (!global.db.Logs.resetLimit) global.db.Logs.resetLimit = []
         global.db.Logs.resetLimit.push({
            date: jakartaTime,
            total: totalReset,
            limit: resetValue,
            by: sender
         })
         if (global.db.Logs.resetLimit.length > logLimit) {
            global.db.Logs.resetLimit.shift()
         }

         const resetReport = `
✅ *RESET LIMIT BERHASIL*

• Total user yang direset : ${totalReset}
• Limit baru untuk user free : ${resetValue}
• Terakhir direset : ${jakartaTime}

📝 *Catatan*: 
Reset hanya berlaku untuk user free dengan limit di bawah default, kecuali pakai *--force*.
         `
         await client.reply(m.chat, Func.texted('bold', resetReport), m)
         console.log(`[RESET] ${totalReset} user free direset ke ${resetValue} oleh ${sender}`)
      } catch (e) {
         console.error('[ERROR] Gagal melakukan reset:', e)
         return client.reply(m.chat, 
            Func.texted('bold', '🚩 Gagal melakukan reset limit. Silakan coba lagi.'), 
            m
         )
      }
   },
   owner: true,
   cache: true,
   location: __filename
}