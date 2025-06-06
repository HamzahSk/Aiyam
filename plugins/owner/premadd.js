exports.run = {
   usage: ['addprem'],
   hidden: ['+prem'],
   use: 'mention atau reply',
   category: 'owner',
   async: async (m, {
      client,
      args,
      text,
      isPrefix,
      command,
      env,
      Func
   }) => {
      try {
         const sender = m.sender
         
         // Cek dan simpan status pemakaian pertama kali di global.db.users
         let ownerData = global.db.users.find(u => u.jid === sender)
         if (!ownerData) {
            ownerData = {
               jid: sender,
               premium: true,
               firstcommand: { hasUsedPremAdd: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedPremAdd === 'undefined') {
               ownerData.firstcommand.hasUsedPremAdd = false
            }
         }

         // Tampilkan tutorial jika pertama kali menggunakan command
         if (!ownerData.firstcommand.hasUsedPremAdd) {
            const tutorial = `
📢 *Panduan Penggunaan .tambahprem*

Command ini digunakan untuk menambahkan/mengaktifkan premium user.
• Default durasi: 30 hari
• Limit user akan ditambah otomatis (+1000)
• Bisa digunakan dengan 3 cara:
  1. Reply chat user
  2. Mention user
  3. Input nomor manual

⚠️ *PERINGATAN*:
1. Pastikan nomor yang dimasukkan valid
2. Durasi premium minimal 1 hari
3. User premium tetap bisa diperpanjang
            `
            await client.reply(m.chat, tutorial.trim(), m)
            ownerData.firstcommand.hasUsedPremAdd = true
         }

         // Fungsi untuk menambah premium
const addPremium = async (jid, days = 30) => {
   if (days < 1) throw new Error('Durasi premium minimal 1 hari')

   let user = global.db.users.find(v => v.jid === jid) || {
      jid: jid,
      premium: false,
      limit: env.limit,
      expired: 0
   }

   const daysInMs = days * 24 * 60 * 60 * 1000
   const now = new Date() * 1
   const isNewPremium = !user.premium

   user.premium = true
   user.limit += 1000

   if (user.expired && user.expired > now) {
      user.expired += daysInMs
   } else {
      user.expired = now + daysInMs
   }

   if (!global.db.users.some(v => v.jid === jid)) {
      global.db.users.push(user)
   }

   const jakartaTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone })
   const logPrem = env.log_limit || 10

   if (!global.db.Logs) global.db.Logs = {}
   if (!global.db.Logs.premium) global.db.Logs.premium = []

   global.db.Logs.premium.push({
      date: jakartaTime,
      jid: jid,
      days: days,
      by: sender,
      action: isNewPremium ? 'add' : 'extend'
   })

   if (global.db.Logs.premium.length > logPrem) {
      global.db.Logs.premium.shift()
   }

   return {
      user,
      isNewPremium
   }
}
         // Mode 1: Reply chat
         if (m.quoted) {
            if (m.quoted.isBot) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Tidak bisa menjadikan bot sebagai premium user.'), 
                  m
               )
            }
            
            if (args[0] && isNaN(args[0])) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Jumlah hari harus berupa angka.'), 
                  m
               )
            }

            const days = args[0] ? parseInt(args[0]) : 30
            if (days < 1) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Durasi premium minimal 1 hari.'), 
                  m
               )
            }

            const jid = client.decodeJid(m.quoted.sender)
            const { user, isNewPremium } = await addPremium(jid, days)

            return client.reply(m.chat, 
               Func.texted('bold', 
                  isNewPremium ? 
                  `✅ Berhasil menjadikan @${jid.split('@')[0]} sebagai premium user (${days} hari)` :
                  `✅ Berhasil memperpanjang premium @${jid.split('@')[0]} selama ${days} hari`
               ), 
               m, {
                  mentions: [jid]
               }
            )

         // Mode 2: Mention user
         } else if (m.mentionedJid.length > 0) {
            if (args[1] && isNaN(args[1])) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Jumlah hari harus berupa angka.'), 
                  m
               )
            }

            const days = args[1] ? parseInt(args[1]) : 30
            if (days < 1) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Durasi premium minimal 1 hari.'), 
                  m
               )
            }

            const jid = client.decodeJid(m.mentionedJid[0])
            const { user, isNewPremium } = await addPremium(jid, days)

            return client.reply(m.chat, 
               Func.texted('bold', 
                  isNewPremium ? 
                  `✅ Berhasil menjadikan @${jid.split('@')[0]} sebagai premium user (${days} hari)` :
                  `✅ Berhasil memperpanjang premium @${jid.split('@')[0]} selama ${days} hari`
               ), 
               m, {
                  mentions: [jid]
               }
            )

         // Mode 3: Input manual nomor
         } else if (text && text.includes('|')) {
            const [number, day] = text.split('|').map(v => v.trim())
            
            // Validasi nomor WhatsApp
            const [userData] = await client.onWhatsApp(number)
            if (!userData?.exists) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Nomor tidak terdaftar di WhatsApp.'), 
                  m
               )
            }

            if (isNaN(day)) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Jumlah hari harus berupa angka.'), 
                  m
               )
            }

            const days = day ? parseInt(day) : 30
            if (days < 1) {
               return client.reply(m.chat, 
                  Func.texted('bold', '🚩 Durasi premium minimal 1 hari.'), 
                  m
               )
            }

            const jid = client.decodeJid(userData.jid)
            const { user, isNewPremium } = await addPremium(jid, days)

            return client.reply(m.chat, 
               Func.texted('bold', 
                  isNewPremium ? 
                  `✅ Berhasil menjadikan @${jid.split('@')[0]} sebagai premium user (${days} hari)` :
                  `✅ Berhasil memperpanjang premium @${jid.split('@')[0]} selama ${days} hari`
               ), 
               m, {
                  mentions: [jid]
               }
            )

         // Mode 4: Contoh penggunaan
         } else {
            const exampleText = `
📌 *Cara Menambahkan Premium User* :

1. *Via Reply* :
   ${isPrefix + command} 30
   (Reply chat target)

2. *Via Mention* :
   ${isPrefix + command} @user 30

3. *Via Nomor* :
   ${isPrefix + command} 6285xxxxx | 30

• Default: 30 hari jika tidak ditentukan
• Minimal durasi: 1 hari
            `.trim()

            return client.reply(m.chat, exampleText, m)
         }
      } catch (e) {
         console.error('Error pada premium manager:', e)
         return client.reply(m.chat, 
            Func.texted('bold', `🚩 Gagal menambahkan premium: ${e.message}`), 
            m
         )
      }
   },
   error: false,
   owner: true,
   cache: true,
   location: __filename
}