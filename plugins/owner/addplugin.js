const fs = require('fs')
const path = require('path')

exports.run = {
   usage: ['addplugin'],
   hidden: ['addpg'],
   category: 'owner',
   async: async (m, {
      client,
      text,
      Func,
      env,
      setting
   }) => {
      try {
         // Cek dan simpan status pemakaian pertama kali
         let ownerData = global.db.users.find(u => u.jid === m.sender)
         if (!ownerData) {
            ownerData = {
               jid: m.sender,
               firstcommand: { hasUsedAddPlugin: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedAddPlugin === 'undefined') {
               ownerData.firstcommand.hasUsedAddPlugin = false
            }
         }

         // Tampilkan panduan jika pertama kali menggunakan
         if (!ownerData.firstcommand.hasUsedAddPlugin) {
            const tutorial = `
📢 *Panduan Penggunaan .addplugin*

Command ini digunakan untuk menambahkan/update plugin JS ke bot.

• Balas file .js dengan command ini
• Optional: Tambahkan nama folder sebagai argumen untuk menyimpan di subfolder

Contoh:
1. .addplugin (balas file plugin) → Simpan di folder utama
2. .addplugin games (balas file plugin) → Simpan di folder "games"

⚠️ Catatan:
• File akan otomatis replace jika sudah ada
• Hanya owner yang bisa menggunakan command ini
            `.trim()
            await client.reply(m.chat, tutorial, m)
            ownerData.firstcommand.hasUsedAddPlugin = true
            return
         }

         // Validasi pesan yang dibalas
         if (!m.quoted || typeof m.quoted.download !== 'function') 
            return client.reply(m.chat, Func.texted('bold', '❌ Balas file plugin .js-nya dulu, bukan teks atau lainnya.'), m)
         
         const fileName = m.quoted.fileName || 'plugin.js'
         if (!fileName.endsWith('.js')) 
            return client.reply(m.chat, Func.texted('bold', '❌ File harus berekstensi .js, plugin harus format JavaScript.'), m)

         await client.sendReact(m.chat, '⏳', m.key)

         // Menentukan path penyimpanan
         const basePath = path.join(__dirname, '../')
         let folder = text ? text.trim().toLowerCase() : null
         let savePath = folder ? path.join(basePath, folder) : basePath

         // Membuat folder jika belum ada
         if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath, { recursive: true })
         }

         const buffer = await m.quoted.download()
         const fullPath = path.join(savePath, fileName)
         
         // Cek apakah file sudah ada
         const fileExists = fs.existsSync(fullPath)
         
         // Menulis file (akan otomatis replace jika sudah ada)
         fs.writeFileSync(fullPath, buffer)
         
         await client.sendReact(m.chat, '✅', m.key)
         
         // Waktu pakai Asia/Jakarta
         const jakartaTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone })

         // Simpan log ke database
         if (!global.db.Logs) global.db.Logs = {}
         if (!global.db.Logs.addplugin) global.db.Logs.addplugin = []
         global.db.Logs.addplugin.push({
            action: fileExists ? 'update' : 'add',
            name: fileName,
            folder: folder || 'root',
            date: jakartaTime,
            by: m.sender
         })
         if (global.db.Logs.addplugin.length > env.log_limit) {
            global.db.Logs.addplugin.shift()
         }

         // Pesan sukses dengan informasi replace
         const successMessage = `
✨ *PLUGIN ${fileExists ? 'DIUPDATE' : 'DITAMBAHKAN'}*

• Nama file : ${fileName}
• Lokasi : ${folder || 'root'}
• Waktu : ${jakartaTime}

${fileExists ? '♻️ Plugin berhasil diperbarui.' : '✅ Plugin berhasil ditambahkan.'}
         `.trim()
         
         return client.reply(m.chat, Func.texted('bold', successMessage), m)
      } catch (e) {
         console.error('[ERROR] AddPlugin:', e)
         return client.reply(m.chat, 
            Func.texted('bold', `❌ Gagal menambahkan plugin:\n${e.message}`), 
            m
         )
      }
   },
   owner: true,
   cache: true,
   location: __filename
}