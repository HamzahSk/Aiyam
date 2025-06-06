const fs = require('fs')
const path = require('path')

exports.run = {
   usage: ['pulihkan'],
   hidden: ['restore'],
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

         // Cek dan simpan status pemakaian pertama kali
         let ownerData = global.db.users.find(u => u.jid === sender)
         if (!ownerData) {
            ownerData = {
               jid: sender,
               limit: env.limit,
               premium: true,
               firstcommand: { hasUsedRestore: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedRestore === 'undefined') {
               ownerData.firstcommand.hasUsedRestore = false
            }
         }

         // Tampilkan panduan pertama kali
         if (!ownerData.firstcommand.hasUsedRestore) {
            const tutorial = `
📢 *Panduan Penggunaan .pulihkan*

Command ini digunakan untuk memulihkan database dari file backup.
• Backup harus dalam format JSON yang valid
• Proses ini akan menimpa semua data saat ini
• Selalu buat backup sebelum melakukan restore

📌 Cara penggunaan:
1. Kirim file backup JSON ke bot
2. Balas file tersebut dengan command .pulihkan
3. Ikuti instruksi yang diberikan

⚠️ *PERHATIAN*:
- Pastikan file backup valid dan tidak corrupt
- Proses tidak bisa dibatalkan setelah dimulai
- Data saat ini akan diganti dengan data dari backup
            `
            await client.reply(m.chat, tutorial.trim(), m)
            ownerData.firstcommand.hasUsedRestore = true
            return
         }

         // Validasi file backup
         if (!m.quoted || !/document/.test(m.quoted.mtype) || !/\.json$/.test(m.quoted.fileName)) {
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 Harap balas file backup JSON yang valid.'), 
               m
            )
         }

         // Download file backup
         const processingMsg = await client.reply(m.chat, Func.texted('bold', '🔄 Memproses file backup...'), m)
         const fn = await Func.getFile(await m.quoted.download())
         
         if (!fn.status) {
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 Gagal mengunduh file backup.'), 
               m
            )
         }

         // Validasi isi file
         let backupData
         try {
            backupData = JSON.parse(fs.readFileSync(fn.file, 'utf-8'))
            if (!backupData.users || !backupData.setting) {
               throw new Error('Format file tidak valid')
            }
         } catch (e) {
            fs.unlinkSync(fn.file)
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 File backup corrupt atau format tidak valid.'), 
               m
            )
         }

         // Simpan data backup untuk konfirmasi
         global.db._confirm = global.db._confirm || {}
         global.db._confirm[sender] = {
            type: 'restore',
            filePath: fn.file,
            backupData: backupData,
            processingMsg: processingMsg.key
         }

         // Kirim konfirmasi
         const confirmMsg = `
⚠️ *KONFIRMASI RESTORE DATABASE*

Anda akan mengembalikan database dari backup:
• Total user: ${backupData.users.length}
• Pengaturan: ${Object.keys(backupData.setting).length} item
• Terakhir update: ${new Date(backupData.setting.lastBackup || 0).toLocaleString('id-ID', { timeZone: env.Timezone })}

Balas pesan ini dengan:
*Y* untuk melanjutkan restore
*N* untuk membatalkan
         `.trim()

         await client.reply(m.chat, confirmMsg, m)

      } catch (e) {
         console.error('[ERROR] Gagal memproses restore:', e)
         return client.reply(m.chat, 
            Func.texted('bold', `🚩 Gagal memproses restore: ${e.message}`), 
            m
         )
      }
   },
   owner: true,
   cache: true,
   location: __filename
}