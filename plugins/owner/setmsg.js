exports.run = {
   usage: ['aturpesan'],
   hidden: ['setmessage', 'setmsg', 'setpesan'],
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
               firstcommand: { hasUsedSetMsg: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedSetMsg === 'undefined') {
               ownerData.firstcommand.hasUsedSetMsg = false
            }
         }

         if (!ownerData.firstcommand.hasUsedSetMsg) {
            const tutorial = `
📢 *Panduan Pengaturan Pesan Menu*

• Digunakan untuk mengatur pesan menu utama bot
• Dapat menggunakan variabel khusus:
  - *+tag* : Mention pengguna
  - *+name* : Nama pengguna
  - *+greeting* : Salam waktu
  - *+db* : Jenis database
  - *+version* : Versi bot

📝 *Contoh Penggunaan*:
${isPrefix}setmsg Hai +tag! +greeting
Saya adalah bot WhatsApp versi +version

🔖 *Catatan*:
- Maksimal 500 karakter
- Perubahan akan tercatat di logs
- Langsung berlaku setelah diupdate
            `.trim()
            await client.reply(m.chat, tutorial, m)
            ownerData.firstcommand.hasUsedSetMsg = true
            return
         }

         // Jika tidak ada teks, tampilkan panduan
         if (!text) {
            return client.reply(m.chat, generateGuide(isPrefix, command), m)
         }

         // Validasi panjang teks
         if (text.length > 500) {
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 Pesan terlalu panjang. Maksimal 500 karakter.'), 
               m
            )
         }

         // Simpan pesan baru
         const previousMsg = setting.msg
         setting.msg = text
         setting.msgLastUpdate = new Date() * 1

         // Log action
         if (!global.db.Logs) global.db.Logs = {}
         if (!global.db.Logs.setMsg) global.db.Logs.setMsg = []
         global.db.Logs.setMsg.push({
            date: jakartaTime,
            newMsg: text,
            oldMsg: previousMsg || 'Tidak ada',
            by: sender
         })

         // Rotasi log
         if (global.db.Logs.setMsg.length > env.log_limit) {
            global.db.Logs.setMsg.shift()
         }

         // Kirim konfirmasi dengan preview
         const preview = text
            .replace('+tag', `@${m.sender.split('@')[0]}`)
            .replace('+name', m.pushName)
            .replace('+greeting', Func.greeting())
            .replace('+db', setting.db === 'json' ? 'JSON' : 'MongoDB')
            .replace('+version', env.version)

         const successMsg = `
✅ *Pesan Menu Berhasil Diupdate!*

📝 *Preview* :
${preview}

🕒 *Diupdate Pada* :
${jakartaTime}

📊 *Logs* : ${global.db.Logs.setMsg.length}/${env.log_limit}

💾 *Pesan Sebelumnya* :
${previousMsg || 'Tidak ada'}
         `.trim()

         await client.reply(m.chat, Func.texted('bold', successMsg), m)

      } catch (e) {
         console.error('[SETMSG ERROR]', e)
         return client.reply(m.chat, 
            Func.texted('bold', `🚩 Gagal mengupdate pesan menu: ${e.message}`), 
            m
         )
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}

// Fungsi untuk generate panduan
const generateGuide = (prefix, command) => {
   const guide = `
📌 *PANDUAN SET PESAN MENU* :

Anda dapat menggunakan variabel berikut:
• *+tag* : Untuk mention pengguna
• *+name* : Nama pengguna
• *+greeting* : Salam sesuai waktu
• *+db* : Jenis database
• *+version* : Versi bot

📝 *Contoh Penggunaan* :
${prefix + command} Hai +tag! +greeting
Saya adalah bot WhatsApp.
Database: +db | Versi: +version

🔖 *Catatan* :
- Maksimal 500 karakter
- Perubahan langsung berlaku
   `.trim()
   
   return Func.texted('bold', guide)
}