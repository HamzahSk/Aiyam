/**
 * Modul untuk mengatur watermark stiker (packname dan author)
 * Hanya dapat digunakan oleh owner bot
 */

exports.run = {
   usage: ['setwatermark'],
   hidden: ['setwm', 'watermark'],
   category: 'owner',
   async: async (m, {
      client,
      text,
      args,
      isPrefix,
      command,
      setting,
      env,
      Func,
      db
   }) => {
      try {
         const sender = m.sender
         const jakartaTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone })

         // Cek dan simpan status pemakaian pertama kali
         let ownerData = global.db.users.find(u => u.jid === sender)
         if (!ownerData) {
            ownerData = {
               jid: sender,
               limit: env.limit,
               premium: true,
               firstcommand: { hasUsedSetWm: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedSetWm === 'undefined') {
               ownerData.firstcommand.hasUsedSetWm = false
            }
         }

         if (!ownerData.firstcommand.hasUsedSetWm) {
            const tutorial = `
📢 *Panduan Pengaturan Watermark Stiker*

• Digunakan untuk mengatur packname dan author pada stiker
• Format: ${isPrefix}setwm [packname] | [author]

Contoh:
${isPrefix}setwm Stiker Keren | @username
${isPrefix}setwm Pack Bot | ${env.owner_name}

⚠️ Catatan:
- Gunakan tanda "|" sebagai pemisah
- Author bisa menggunakan nama atau username
- Perubahan akan tercatat di logs
            `
            await client.reply(m.chat, tutorial.trim(), m)
            ownerData.firstcommand.hasUsedSetWm = true
            return
         }

         // Validasi jika teks kosong
         if (!text) {
            return client.reply(m.chat, 
               `Contoh penggunaan: ${isPrefix}${command} Nama Pack | Author Stiker\n\nContoh: ${isPrefix}${command} Stiker Keren | @username`, 
               m
            )
         }
         
         // Memisahkan packname dan author
         let [packname, ...author] = text.split('|')
         author = (author || []).join('|').trim()
         
         // Menyimpan ke database
         setting.sk_pack = packname.trim() || ''
         setting.sk_author = author || ''
         setting.wmLastUpdate = new Date() * 1

         // Log action
         if (!global.db.Logs) global.db.Logs = {}
         if (!global.db.Logs.setWm) global.db.Logs.setWm = []
         global.db.Logs.setWm.push({
            date: jakartaTime,
            packname: packname.trim(),
            author: author,
            by: sender
         })

         // Rotasi log
         if (global.db.Logs.setWm.length > env.log_limit) {
            global.db.Logs.setWm.shift()
         }

         // Respon sukses
         client.reply(m.chat, 
            Func.texted('bold', 
               `✅ *Watermark stiker berhasil diatur!*\n\n` +
               `• Packname: ${packname.trim()}\n` +
               `• Author: ${author}\n` +
               `• Update: ${jakartaTime}\n\n` +
               `📝 Logs tersimpan: ${global.db.Logs.setWm.length}/${env.log_limit}`
            ), 
            m
         )
      } catch (e) {
         console.error('Error saat mengatur watermark:', e)
         client.reply(m.chat, 
            Func.texted('bold', `❌ Gagal mengatur watermark:\n${e.message}`), 
            m
         )
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}