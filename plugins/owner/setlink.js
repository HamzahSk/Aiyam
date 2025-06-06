exports.run = {
   usage: ['aturlink'],
   hidden: ['setlink', 'linkconfig'],
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
               firstcommand: { hasUsedSetLink: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedSetLink === 'undefined') {
               ownerData.firstcommand.hasUsedSetLink = false
            }
         }

         if (!ownerData.firstcommand.hasUsedSetLink) {
            const tutorial = `
📢 *Panduan Pengaturan Link Bot*

• Digunakan untuk mengatur link resmi bot
• Link akan digunakan untuk berbagai keperluan:
  - Unduhan
  - Website
  - Dokumentasi
  - Lainnya

📝 *Contoh Penggunaan*:
${isPrefix}aturlink https://website-anda.com
${isPrefix}setlink https://link-alternatif.com

⚠️ *Persyaratan*:
- Harus menggunakan HTTPS
- Domain harus terdaftar di whitelist
- Maksimal panjang URL: 200 karakter

🔧 *Link Saat Ini*:
${setting.link || 'Belum diatur'}
            `.trim()
            await client.reply(m.chat, tutorial, m)
            ownerData.firstcommand.hasUsedSetLink = true
            return
         }

         // Jika tidak ada URL yang diberikan
         if (!text) {
            const example = `
📌 *Cara Menggunakan* :
${isPrefix + command} https://link-anda.com

🔗 *Link Saat Ini* : 
${setting.link || 'Belum diatur'}
            `.trim()
            return client.reply(m.chat, example, m)
         }

         // Validasi URL
         if (!Func.isUrl(text)) {
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 Format URL tidak valid. Pastikan URL dimulai dengan http:// atau https://'), 
               m
            )
         }

         // Validasi panjang URL
         if (text.length > 200) {
            return client.reply(m.chat,
               Func.texted('bold', '🚩 URL terlalu panjang. Maksimal 200 karakter.'),
               m
            )
         }

         // Validasi domain khusus
         const allowedDomains = env.allowedDomains || ['https://yourdomain.com', 'https://anotherdomain.com']
         if (allowedDomains.length > 0 && !allowedDomains.some(domain => text.startsWith(domain))) {
            return client.reply(m.chat, 
               Func.texted('bold', `🚩 Hanya domain berikut yang diizinkan:\n${allowedDomains.join('\n')}`), 
               m
            )
         }

         // Simpan link baru
         const previousLink = setting.link
         setting.link = text
         setting.linkLastUpdate = new Date() * 1

         // Log action
         if (!global.db.Logs) global.db.Logs = {}
         if (!global.db.Logs.setLink) global.db.Logs.setLink = []
         global.db.Logs.setLink.push({
            date: jakartaTime,
            oldLink: previousLink || 'Tidak ada',
            newLink: text,
            by: sender
         })

         // Rotasi log
         if (global.db.Logs.setLink.length > env.log_limit) {
            global.db.Logs.setLink.shift()
         }

         // Kirim konfirmasi
         const successMsg = `
✅ *Link Berhasil Diupdate!*

🔗 *Link Sebelumnya* :
${previousLink || 'Tidak ada'}

🔗 *Link Baru* :
${text}

⏰ *Diupdate Pada* :
${jakartaTime}

📊 *Logs* : ${global.db.Logs.setLink.length}/${env.log_limit}
         `.trim()

         await client.reply(m.chat, Func.texted('bold', successMsg), m)

      } catch (e) {
         console.error('[SETLINK ERROR]', e)
         return client.reply(m.chat, 
            Func.texted('bold', `🚩 Gagal mengupdate link: ${e.message}`), 
            m
         )
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}