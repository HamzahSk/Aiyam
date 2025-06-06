exports.run = {
   usage: [
      '+owner', '-owner', // tambah/hapus owner
      '+prem', '-prem',  // tambah/hapus premium
      'block', 'unblock', // blokir/unblokir
      'ban', 'unban'      // banned/unbanned
   ],
  // hidden: ['manager'],
   category: 'owner',
   async: async (m, {
      client,
      text,
      args,
      command,
      setting,
      env,
      Func,
      db
   }) => {
      try {
         const sender = m.sender
         
         // Cek dan simpan status pemakaian pertama kali di global.db.users
         let ownerData = global.db.users.find(u => u.jid === sender)
         if (!ownerData) {
            ownerData = {
               jid: sender,
               limit: env.limit,
               premium: true,
               firstcommand: { hasUsedManager: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedManager === 'undefined') {
               ownerData.firstcommand.hasUsedManager = false
            }
         }

         if (!ownerData.firstcommand.hasUsedManager) {
            const tutorial = `
📢 *Panduan Penggunaan Manager Commands*

• *+owner* [mention/reply] : Tambah user sebagai owner
• *-owner* [mention/reply] : Hapus user dari owner
• *+prem* [mention/reply] : Berikan status premium (30 hari)
• *-prem* [mention/reply] : Hapus status premium
• *block* [mention/reply] : Blokir user
• *unblock* [mention/reply] : Buka blokir user
• *ban* [mention/reply] : Ban user dari bot
• *unban* [mention/reply] : Buka ban user

Contoh:
+owner @user - Tambah user sebagai owner
ban @user - Ban user dari bot

⚠️ Catatan: Semua perubahan akan tercatat di logs.
            `
            await client.reply(m.chat, tutorial.trim(), m)
            ownerData.firstcommand.hasUsedManager = true
         }

         // Validasi target
         const input = m?.mentionedJid?.[0] || m?.quoted?.sender || text
         if (!input) {
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 Mohon mention atau reply target.'), 
               m
            )
         }

         // Cek nomor WhatsApp
         const p = await client.onWhatsApp(input.trim())
         if (!p.length) {
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 Nomor tidak terdaftar di WhatsApp.'), 
               m
            )
         }

         const jid = client.decodeJid(p[0].jid)
         const number = jid.replace(/@.+/, '')
         const jakartaTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone })

         // +owner: Tambah owner
         if (command === '+owner') {
            let owners = global.db.setting.owners
            if (owners.includes(number)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `⚠️ @${number} sudah menjadi owner.`), 
                  m
               )
            }
            owners.push(number)
            
            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.manager) global.db.Logs.manager = []
            global.db.Logs.manager.push({
               date: jakartaTime,
               action: 'Add Owner',
               target: number,
               by: sender
            })
            if (global.db.Logs.manager.length > env.log_limit) { global.db.Logs.manager.shift() }
            
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil menambahkan @${number} sebagai owner.`), 
               m
            )

         // -owner: Hapus owner
         } else if (command === '-owner') {
            let owners = global.db.setting.owners
            if (!owners.includes(number)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `🚩 @${number} bukan owner.`), 
                  m
               )
            }
            global.db.setting.owners = global.db.setting.owners.filter(v => v !== number)
            
            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.manager) global.db.Logs.manager = []
            global.db.Logs.manager.push({
               date: jakartaTime,
               action: 'Remove Owner',
               target: number,
               by: sender
            })
            if (global.db.Logs.manager.length > env.log_limit) { global.db.Logs.manager.shift() }
            
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil menghapus @${number} dari daftar owner.`), 
               m
            )

         // +prem: Tambah premium
         } else if (command === '+prem') {
            let user = global.db.users.find(v => v.jid === jid) || {
               jid: jid,
               premium: false,
               limit: env.limit,
               expired: 0
            }
            
            user.premium = true
            user.expired = Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 hari
            
            if (!global.db.users.some(v => v.jid === jid)) {
               global.db.users.push(user)
            }
            
            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.manager) global.db.Logs.manager = []
            global.db.Logs.manager.push({
               date: jakartaTime,
               action: 'Add Premium',
               target: number,
               by: sender,
               duration: '30 days'
            })
            if (global.db.Logs.manager.length > env.log_limit) { global.db.Logs.manager.shift() }
            
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil mengaktifkan premium untuk @${number} selama 30 hari.`), 
               m
            )

         // -prem: Hapus premium
         } else if (command === '-prem') {
            let user = global.db.users.find(v => v.jid === jid)
            if (!user) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Data pengguna tidak ditemukan.'), 
                  m
               )
            }
            if (!user.premium) {
               return client.reply(m.chat, 
                  Func.texted('bold', `🚩 @${number} bukan akun premium.`), 
                  m
               )
            }
            
            user.premium = false
            user.expired = 0
            user.limit = env.limit
            
            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.manager) global.db.Logs.manager = []
            global.db.Logs.manager.push({
               date: jakartaTime,
               action: 'Remove Premium',
               target: number,
               by: sender
            })
            if (global.db.Logs.manager.length > env.log_limit) { global.db.Logs.manager.shift() }
            
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil menghapus status premium @${number}.`), 
               m
            )

         // block: Blokir pengguna
         } else if (command === 'block') {
            if (jid === client.decodeJid(client.user.id)) return
            await client.updateBlockStatus(jid, 'block')
            
            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.manager) global.db.Logs.manager = []
            global.db.Logs.manager.push({
               date: jakartaTime,
               action: 'Block User',
               target: number,
               by: sender
            })
            if (global.db.Logs.manager.length > env.log_limit) { global.db.Logs.manager.shift() }
            
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil memblokir @${number}.`), 
               m
            )

         // unblock: Buka blokir
         } else if (command === 'unblock') {
            await client.updateBlockStatus(jid, 'unblock')
            
            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.manager) global.db.Logs.manager = []
            global.db.Logs.manager.push({
               date: jakartaTime,
               action: 'Unblock User',
               target: number,
               by: sender
            })
            if (global.db.Logs.manager.length > env.log_limit) { global.db.Logs.manager.shift() }
            
            return client.reply(m.chat, 
               Func.texted('bold', `✅ Berhasil membuka blokir @${number}.`), 
               m
            )

         // ban: Banned pengguna
         } else if (command === 'ban') {
            const isOwner = [client.decodeJid(client.user.id).split('@')[0], 
                         env.owner, 
                         ...global.db.setting.owners]
                         .map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
                         .includes(jid)
            
            if (isOwner) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Tidak bisa mem-banned nomor owner.'), 
                  m
               )
            }
            
            let user = global.db.users.find(v => v.jid === jid)
            if (!user) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Data pengguna tidak ditemukan.'), 
                  m
               )
            }
            if (user.banned) {
               return client.reply(m.chat, 
                  Func.texted('bold', `🚩 @${number} sudah di-banned sebelumnya.`), 
                  m
               )
            }
            
            user.banned = true
            const bannedCount = global.db.users.filter(v => v.banned).length
            
            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.manager) global.db.Logs.manager = []
            global.db.Logs.manager.push({
               date: jakartaTime,
               action: 'Ban User',
               target: number,
               by: sender,
               totalBanned: bannedCount
            })
            if (global.db.Logs.manager.length > env.log_limit) { global.db.Logs.manager.shift() }
            
            return client.reply(m.chat, 
               `乂  *B A N N E D*\n\n` +
               `• @${number} telah di-banned\n` +
               `• Total banned: ${bannedCount}`, 
               m
            )

         // unban: Buka banned
         } else if (command === 'unban') {
            let user = global.db.users.find(v => v.jid === jid)
            if (!user) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Data pengguna tidak ditemukan.'), 
                  m
               )
            }
            if (!user.banned) {
               return client.reply(m.chat, 
                  Func.texted('bold', `🚩 @${number} tidak dalam status banned.`), 
                  m
               )
            }
            
            user.banned = false
            const bannedCount = global.db.users.filter(v => v.banned).length
            
            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.manager) global.db.Logs.manager = []
            global.db.Logs.manager.push({
               date: jakartaTime,
               action: 'Unban User',
               target: number,
               by: sender,
               totalBanned: bannedCount
            })
            if (global.db.Logs.manager.length > env.log_limit) { global.db.Logs.manager.shift() }
            
            return client.reply(m.chat, 
               `乂  *U N B A N N E D*\n\n` +
               `• @${number} telah di-unbanned\n` +
               `• Total banned: ${bannedCount}`, 
               m
            )
         }
      } catch (e) {
         console.error('Error di manager command:', e)
         return client.reply(m.chat, 
            Func.texted('bold', `🚩 Terjadi error: ${e.message}`), 
            m
         )
      }
   },
   error: false,
   owner: true,
   cache: true,
   location: __filename
}