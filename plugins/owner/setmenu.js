exports.run = {
   usage: ['aturmenu'],
   hidden: ['setmenu', 'menuconfig'],
   category: 'owner',
   async: async (m, {
      client,
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
               firstcommand: { hasUsedSetMenu: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedSetMenu === 'undefined') {
               ownerData.firstcommand.hasUsedSetMenu = false
            }
         }

         if (!ownerData.firstcommand.hasUsedSetMenu) {
            const tutorial = `
📢 *Panduan Pengaturan Menu Bot*

• Digunakan untuk mengubah tampilan menu bot
• Pilih style yang sesuai dengan kebutuhan

🎨 *Daftar Style Menu*:
1. Minimalis (Default) - Teks sederhana
2. Dengan Gambar - Menu dengan gambar header
3. Dengan Tombol - Menu dengan tombol interaktif
4. Interaktif - Menu dengan list message
5. Kustom - Menu dengan template khusus

📝 *Contoh Penggunaan*:
${isPrefix}aturmenu 2 - Ubah ke menu dengan gambar
${isPrefix}setmenu 3 - Ubah ke menu dengan tombol

⚠️ *Catatan*:
- Perubahan akan tercatat di logs
- Mungkin perlu restart untuk efek penuh
            `.trim()
            await client.reply(m.chat, tutorial, m)
            ownerData.firstcommand.hasUsedSetMenu = true
            return
         }

         // Jika tidak ada argumen
         if (!args || !args[0]) {
            const exampleMsg = `
📌 *Cara Menggunakan* :
${isPrefix + command} <opsi>

🎨 *Opsi Tersedia* :
1. Menu Minimalis (Default)
2. Menu dengan Gambar
3. Menu dengan Tombol
4. Menu Interaktif
5. Menu Kustom

🔧 *Style Saat Ini* : ${setting.style || 1}
            `.trim()
            return client.reply(m.chat, exampleMsg, m)
         }

         // Validasi opsi menu
         const availableStyles = ['1', '2', '3', '4', '5']
         if (!availableStyles.includes(args[0])) {
            const styleList = availableStyles.map(style => `• ${style}`).join('\n')
            return client.reply(m.chat, 
               Func.texted('bold', `🚩 Opsi tidak tersedia. Pilih antara:\n${styleList}`), 
               m
            )
         }

         // Update style menu
         const newStyle = parseInt(args[0])
         const previousStyle = setting.style || 1
         setting.style = newStyle
         setting.menuLastUpdate = new Date() * 1

         // Log action
         if (!global.db.Logs) global.db.Logs = {}
         if (!global.db.Logs.setMenu) global.db.Logs.setMenu = []
         global.db.Logs.setMenu.push({
            date: jakartaTime,
            oldStyle: previousStyle,
            newStyle: newStyle,
            by: sender
         })

         // Rotasi log
         if (global.db.Logs.setMenu.length > env.log_limit) {
            global.db.Logs.setMenu.shift()
         }

         // Kirim preview menu
         const styleNames = {
            1: 'Minimalis',
            2: 'Dengan Gambar', 
            3: 'Dengan Tombol',
            4: 'Interaktif',
            5: 'Kustom'
         }

         const successMsg = `
✅ *Menu Berhasil Diupdate!*

🔄 *Perubahan Style* :
${styleNames[previousStyle]} → ${styleNames[newStyle]}

⏰ *Diupdate Pada* :
${jakartaTime}

📊 *Logs* : ${global.db.Logs.setMenu.length}/${env.log_limit}

📝 *Catatan* :
Perubahan mungkin memerlukan restart bot untuk efek penuh.
         `.trim()

         await client.reply(m.chat, Func.texted('bold', successMsg), m)

      } catch (e) {
         console.error('[SETMENU ERROR]', e)
         return client.reply(m.chat, 
            Func.texted('bold', `🚩 Gagal mengupdate menu: ${e.message}`), 
            m
         )
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}