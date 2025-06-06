exports.run = {
   usage: ['+toxic', '-toxic'],
   hidden: ['toxic'],
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
         const toxicDB = global.db.setting.toxic
         const action = command // +toxic atau -toxic
         const word = args[0] ? args[0].toLowerCase() : null
         const jakartaTime = new Date().toLocaleString('id-ID', { timeZone: env.Timezone })

         // Cek dan simpan status pemakaian pertama kali
         let ownerData = global.db.users.find(u => u.jid === sender)
         if (!ownerData) {
            ownerData = {
               jid: sender,
               limit: env.limit,
               premium: true,
               firstcommand: { hasUsedToxic: false }
            }
            global.db.users.push(ownerData)
         } else {
            if (!ownerData.firstcommand) ownerData.firstcommand = {}
            if (typeof ownerData.firstcommand.hasUsedToxic === 'undefined') {
               ownerData.firstcommand.hasUsedToxic = false
            }
         }

         if (!ownerData.firstcommand.hasUsedToxic) {
            const tutorial = `
📢 *Panduan Pengelolaan Kata Toxic*

• *+toxic [kata]* : Tambahkan kata ke daftar toxic
• *-toxic [kata]* : Hapus kata dari daftar toxic

Contoh:
${isPrefix}+toxic kasar - Tambah kata "kasar"
${isPrefix}-toxic kasar - Hapus kata "kasar"

📝 Catatan:
- Daftar kata akan diurutkan otomatis
- Minimal harus ada 1 kata dalam database
- Perubahan akan tercatat di logs
            `
            await client.reply(m.chat, tutorial.trim(), m)
            ownerData.firstcommand.hasUsedToxic = true
            return
         }

         // Handler untuk penambahan kata toxic
         if (action === '+toxic') {
            if (!word) {
               return client.reply(m.chat, 
                  `Contoh penggunaan: ${isPrefix}${command} [kata]\n\n` +
                  `Contoh: ${isPrefix}${command} kasar`, 
                  m
               )
            }

            if (toxicDB.includes(word)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `⚠️ Kata '${word}' sudah ada dalam database!`), 
                  m
               )
            }

            // Tambahkan kata dan urutkan
            toxicDB.push(word)
            toxicDB.sort((a, b) => a.localeCompare(b))

            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.toxic) global.db.Logs.toxic = []
            global.db.Logs.toxic.push({
               date: jakartaTime,
               action: 'Tambah Kata',
               word: word,
               by: sender,
               total: toxicDB.length
            })

            // Rotasi log
            if (global.db.Logs.toxic.length > env.log_limit) {
               global.db.Logs.toxic.shift()
            }

            return client.reply(m.chat, 
               Func.texted('bold', `✅ Kata '${word}' berhasil ditambahkan!\n\n` +
               `📊 Total kata toxic: ${toxicDB.length}\n` +
               `⏱️ ${jakartaTime}`), 
               m
            )
         } 
         // Handler untuk penghapusan kata toxic
         else if (action === '-toxic') {
            if (!word) {
               return client.reply(m.chat, 
                  `Contoh penggunaan: ${isPrefix}${command} [kata]\n\n` +
                  `Contoh: ${isPrefix}${command} kasar`, 
                  m
               )
            }

            if (toxicDB.length < 2) {
               return client.reply(m.chat, 
                  Func.texted('bold', `❌ Tidak bisa menghapus! Minimal harus ada 1 kata dalam database.`), 
                  m
               )
            }

            if (!toxicDB.includes(word)) {
               return client.reply(m.chat, 
                  Func.texted('bold', `❌ Kata '${word}' tidak ditemukan dalam database!`), 
                  m
               )
            }

            // Hapus kata dari array
            const index = toxicDB.indexOf(word)
            toxicDB.splice(index, 1)

            // Log action
            if (!global.db.Logs) global.db.Logs = {}
            if (!global.db.Logs.toxic) global.db.Logs.toxic = []
            global.db.Logs.toxic.push({
               date: jakartaTime,
               action: 'Hapus Kata',
               word: word,
               by: sender,
               total: toxicDB.length
            })

            // Rotasi log
            if (global.db.Logs.toxic.length > env.log_limit) {
               global.db.Logs.toxic.shift()
            }

            return client.reply(m.chat, 
               Func.texted('bold', `✅ Kata '${word}' berhasil dihapus!\n\n` +
               `📊 Sisa kata toxic: ${toxicDB.length}\n` +
               `⏱️ ${jakartaTime}`), 
               m
            )
         } else if (action === 'toxic') {
            return client.reply(m.chat, Func.texted('bold', "list kata toxic\n\n" + toxicDB), m)
         }
      } catch (error) {
         console.error('Error pada manajemen kata toxic:', error)
         return client.reply(m.chat, 
            Func.texted('bold', `⚠️ Terjadi kesalahan:\n${error.message}`), 
            m
         )
      }
   },
   error: false,
   owner: true,
   cache: true,
   location: __filename
}