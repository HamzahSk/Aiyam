/**
 * MODUL PENGATURAN SISTEM BOT
 * 
 * Fitur yang dapat diatur:
 * - autodownload: Otomatis mengunduh media
 * - antispam: Proteksi terhadap spam
 * - debug: Mode debugging
 * - groupmode: Restriksi untuk grup
 * - multiprefix: Multi prefix command
 * - noprefix: Command tanpa prefix
 * - online: Tampilkan status online
 * - self: Mode self/pribadi
 * 
 * Hanya dapat digunakan oleh owner bot
 */

exports.run = {
   usage: ['autodownload', 'antispam', 'debug', 'groupmode', 'multiprefix', 'noprefix', 'autobio', 'online', 'self'],
  // hidden: ['system', 'pengaturan'],
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
         const system = global.db.setting
         const type = command.toLowerCase()
         const currentStatus = system[type] ? 'AKTIF 🟢' : 'NON-AKTIF 🔴'
         const jakartaTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone })

         // Cek dan simpan status pemakaian pertama kali
         let ownerData = global.db.users.find(u => u.jid === sender)
         if (!ownerData) {
            ownerData = {
               jid: sender,
               limit: env.limit,
               premium: true,
               firstcommand: { hasUsedSystem: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedSystem === 'undefined') {
               ownerData.firstcommand.hasUsedSystem = false
            }
         }

         if (!ownerData.firstcommand.hasUsedSystem) {
            const tutorial = `
📢 *Panduan Pengaturan Sistem Bot*

Fitur yang dapat diatur:
• *autobio* : Otomatis memperbaharui bio
• *autodownload* : Otomatis mengunduh media
• *antispam* : Proteksi terhadap spam
• *debug* : Mode debugging
• *groupmode* : Restriksi untuk grup
• *multiprefix* : Multi prefix command
• *noprefix* : Command tanpa prefix
• *online* : Tampilkan status online
• *self* : Mode self/pribadi

Contoh penggunaan:
${isPrefix}autodownload on - Aktifkan auto download
${isPrefix}antispam off - Matikan proteksi spam

⚠️ Catatan:
- Semua perubahan akan tercatat di logs
- Hanya owner yang dapat menggunakan fitur ini
            `
            await client.reply(m.chat, tutorial.trim(), m)
            ownerData.firstcommand.hasUsedSystem = true
            return
         }

         // Jika tidak ada argumen, tampilkan status saat ini
         if (!args || !args[0]) {
            return client.reply(m.chat, 
               `⚙️ *Status Pengaturan* ⚙️\n\n` +
               `🔧 Fitur: *${Func.ucword(command)}*\n` +
               `🔄 Status saat ini: ${currentStatus}\n\n` +
               `Kirim perintah *${isPrefix}${command} on* untuk mengaktifkan\n` +
               `Kirim perintah *${isPrefix}${command} off* untuk menonaktifkan`,
               m
            )
         }

         const option = args[0].toLowerCase()
         const validOptions = ['on', 'off']
         
         // Validasi opsi yang diinput
         if (!validOptions.includes(option)) {
            return client.reply(m.chat, 
               `❌ Opsi tidak valid!\n\n` +
               `Status saat ini: ${currentStatus}\n` +
               `Gunakan *on* atau *off* untuk mengubah pengaturan.`,
               m
            )
         }

         const newStatus = option === 'on'
         
         // Cek jika status sama dengan yang diminta
         if (system[type] === newStatus) {
            return client.reply(m.chat, 
               Func.texted('bold', 
                  `ℹ️ Fitur *${Func.ucword(command)}* sudah dalam status ` +
                  `${newStatus ? 'aktif' : 'non-aktif'} sebelumnya.`
               ), 
               m
            )
         }

         // Update status
         system[type] = newStatus
         
         // Log action
         if (!global.db.Logs) global.db.Logs = {}
         if (!global.db.Logs.system) global.db.Logs.system = []
         global.db.Logs.system.push({
            date: jakartaTime,
            feature: Func.ucword(command),
            status: newStatus ? 'ON' : 'OFF',
            by: sender
         })

         // Rotasi log
         if (global.db.Logs.system.length > env.log_limit) {
            global.db.Logs.system.shift()
         }

         // Kirim respon sukses
         client.reply(m.chat, 
            Func.texted('bold', 
               `✅ *${Func.ucword(command)}* berhasil ` +
               `${newStatus ? 'diaktifkan 🟢' : 'dinonaktifkan 🔴'}\n\n` +
               `📊 Status sekarang: ${newStatus ? 'AKTIF' : 'NON-AKTIF'}\n` +
               `⏱️ Waktu: ${jakartaTime}\n` +
               `📝 Logs: ${global.db.Logs.system.length}/${env.log_limit}`
            ), 
            m
         )

      } catch (error) {
         console.error(`Error pada sistem ${command}:`, error)
         client.reply(m.chat, 
            Func.texted('bold', `⚠️ Gagal mengubah pengaturan!\nError: ${error.message}`),
            m
         )
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}