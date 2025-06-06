const { Component } = require('@neoxr/wb')
const { Version } = new Component()
const fs = require('fs')

exports.run = {
   usage: ['menu', 'help', 'command'],
   category: 'main',
   async: async (m, {
      client,
      text,
      isPrefix,
      command,
      setting,
      users,
      plugins,
      env,
      Func
   }) => {
      try {
         // Data dasar menu
         const local_size = fs.existsSync('./' + env.database + '.json') ? 
            await Func.getSize(fs.statSync('./' + env.database + '.json').size) : ''
         const library = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
         
         // Format pesan pembuka
         const message = setting.msg
            .replace('+tag', `@${m.sender.replace(/@.+/g, '')}`)
            .replace('+name', m.pushName)
            .replace('+greeting', Func.greeting())
            .replace('+db', process.env.DATABASE_URL ? 
               /mongo/.test(process.env.DATABASE_URL) ? 'MongoDB' :
               /postgre/.test(process.env.DATABASE_URL) ? 'PostgreSQL' :
               'Tidak Dikenal' : `Lokal (${local_size})`)
            .replace('+version', (library.dependencies.bails || 
               library.dependencies['@adiwajshing/baileys'] || 
               library.dependencies.baileys)
               .replace(/[\^~]/g, ''))
            .replace('+module', Version)

         // Style menu yang tersedia
         const style = setting.style || 1
         
         // Dapatkan daftar plugin yang valid
         const validPlugins = Object.entries(plugins)
            .filter(([_, plugin]) => plugin.run.usage && 
               (!plugin.run.category || !setting.hidden.includes(plugin.run.category)))

         // Kelompokkan berdasarkan kategori
         const categories = {}
         validPlugins.forEach(([name, plugin]) => {
            const category = plugin.run.category || 'umum'
            if (!categories[category]) categories[category] = []
            categories[category].push(plugin.run)
         })

         // Fungsi untuk membuat daftar perintah dalam kategori
         const generateCategoryCommands = (category) => {
            const commands = categories[category]
               .flatMap(plugin => {
                  const usages = Array.isArray(plugin.usage) ? plugin.usage : [plugin.usage]
                  return usages.map(usage => ({
                     usage: isPrefix + usage,
                     use: plugin.use ? Func.texted('bold', plugin.use) : ''
                  }))
               })
               .sort((a, b) => a.usage.localeCompare(b.usage))
            
            let result = `✧ *${category.toUpperCase()}*\n\n`
            result += commands.map((cmd, i) => {
               if (i === 0) return `┌ ◦ ${cmd.usage} ${cmd.use}`
               if (i === commands.length - 1) return `└ ◦ ${cmd.usage} ${cmd.use}`
               return `│ ◦ ${cmd.usage} ${cmd.use}`
            }).join('\n')
            
            return result
         }

         // Jika ada teks (untuk menampilkan kategori tertentu)
         if (text && style !== 3 && style !== 5) {
            const category = text.trim().toLowerCase()
            if (!categories[category]) return client.reply(m.chat, Func.texted('bold', `🚩 Kategori "${category}" tidak ditemukan`), m)
            
            const categoryMsg = generateCategoryCommands(category)
            return client.reply(m.chat, categoryMsg, m)
         }

         // Tampilkan berdasarkan style
         switch (style) {
            case 1: // Style Minimalis
               let minimalis = message + '\n' + String.fromCharCode(8206).repeat(4001)
               Object.keys(categories).sort().forEach(category => {
                  minimalis += `\n\n✧ *${category.toUpperCase()}*\n\n`
                  minimalis += categories[category]
                     .flatMap(plugin => {
                        const usages = Array.isArray(plugin.usage) ? plugin.usage : [plugin.usage]
                        return usages.map(usage => `◦ ${isPrefix + usage} ${plugin.use ? Func.texted('bold', plugin.use) : ''}`)
                     })
                     .sort()
                     .join('\n')
               })
               client.sendMessageModify(m.chat, minimalis + '\n\n' + global.footer, m, {
                  ads: false,
                  largeThumb: true,
                  thumbnail: setting.cover ? 
                     (Func.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64')) : null,
                  url: setting.link
               })
               break

            case 2: // Style dengan Garis
               let garis = message + '\n' + String.fromCharCode(8206).repeat(4001)
               Object.keys(categories).sort().forEach(category => {
                  garis += `\n\n✧ *${category.toUpperCase()}*\n\n`
                  garis += generateCategoryCommands(category).split('\n').slice(2).join('\n')
               })/*
               client.sendMessageModify(m.chat, garis + '\n\n' + global.footer, m, {
                  ads: false,
                  largeThumb: true,
                  thumbnail: setting.cover ? 
                     (Func.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64')) : null,
                  url: setting.link
               })*/
               client.sendMessage(m.chat, {
  text: garis + `\n\n${global.footer}`,
  contextInfo: {
    forwardingScore: 1,
    isForwarded: true,
    mentionedJid: [m.sender],
    forwardedNewsletterMessageInfo: {
      newsletterJid: '120363400889431614@newsletter',
      serverMessageId: 101,
      newsletterName: 'Skuyak'
    },
    externalAdReply: {
      showAdAttribution: false,
      title: "menu aiyam bot!",
      body: "Dikirim via WhatsApp",
      mediaType: 1,
      thumbnail: setting.cover ? 
        (Func.isUrl(setting.cover) ? await Func.fetchBuffer(setting.cover) : Buffer.from(setting.cover, 'base64')) : null,
      renderLargerThumbnail: true,
      sourceUrl: setting.link
    }
  }
}, {
  quoted: {
    key: {
      fromMe: false,
      participant: '0@s.whatsapp.net',
      remoteJid: 'status@broadcast'
    },
    message: {
      extendedTextMessage: {
        text: 'WhatsApp',
        contextInfo: {
          mentionedJid: [m.sender]
        }
      }
    }
  }
})
               break

            case 3: // Style dengan List Button
               if (text) {
                  const category = text.trim().toLowerCase()
                  if (!categories[category]) return client.reply(m.chat, Func.texted('bold', `🚩 Kategori "${category}" tidak ditemukan`), m)
                  
                  const categoryMsg = generateCategoryCommands(category)
                  client.reply(m.chat, categoryMsg, m)
               } else {
                  const options = Object.keys(categories).sort().map(category => ({
                     title: Func.ucword(category),
                     description: `${categories[category].length} perintah tersedia`,
                     id: `${isPrefix}menu ${category}`
                  }))

                  const buttons = [{
                     name: "single_select",
                     buttonParamsJson: JSON.stringify({
                        title: "Pilih Kategori Menu",
                        sections: [{ rows: options }]
                     })
                  }]

                  client.sendIAMessage(m.chat, buttons, m, {
                     header: 'PILIH MENU',
                     content: message,
                     footer: global.footer,
                     media: setting.cover ? (Func.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64')) : null
                  })
               }
               break
               
            case 4: // Style Carousel
               const cards = Object.keys(categories).sort().map(category => ({
                  header: {
                     imageMessage: setting.cover ? 
                        (Func.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64')) : null,
                     hasMediaAttachment: !!setting.cover
                  },
                  body: {
                     text: `📂 ${Func.ucword(category)}\n${categories[category].length} perintah tersedia`
                  },
                  nativeFlowMessage: {
                     buttons: [{
                        name: "quick_reply",
                        buttonParamsJson: JSON.stringify({
                           display_text: `Lihat Perintah ${category}`,
                           id: `${isPrefix}menu ${category}`
                        })
                     }]
                  }
               }))
               
               client.sendCarousel(m.chat, cards, m, {
                  content: message,
                  footer: global.footer
               })
               break

            case 5: // Style Modern dengan Quick Reply
               if (text) {
                  const categoryIndex = parseInt(text.trim()) - 1
                  const categoryList = Object.keys(categories).sort()
                  
                  if (isNaN(categoryIndex)) {
                     return client.reply(m.chat, Func.texted('bold', '🚩 Harap masukkan nomor yang valid'), m)
                  }
                  
                  if (categoryIndex < 0 || categoryIndex >= categoryList.length) {
                     return client.reply(m.chat, Func.texted('bold', '🚩 Nomor kategori tidak valid'), m)
                  }
                  
                  const category = categoryList[categoryIndex]
                  const categoryMsg = generateCategoryCommands(category)
                  client.reply(m.chat, categoryMsg, m)
               } else {
                  let modernMsg = message + '\n\n'
                  modernMsg += 'Balas dengan nomor untuk melihat perintah:\n\n'
                  
                  const categoryList = Object.keys(categories).sort()
                  categoryList.forEach((category, i) => {
                     modernMsg += `${i+1}. ${Func.ucword(category)}\n`
                  })
                  
                  const buttons = categoryList.map((category, i) => ({
                     name: 'quick_reply',
                     buttonParamsJson: JSON.stringify({
                        display_text: `${i+1}`,
                        id: `${isPrefix + command} ${i+1}`
                     })
                  }))
                  
                  client.sendIAMessage(m.chat, buttons, m, {
                     content: modernMsg,
                     footer: global.footer,
                     media: setting.cover ? 
                        (Func.isUrl(setting.cover) ? setting.cover : Buffer.from(setting.cover, 'base64')) : null
                  })
               }
               break
         }
      } catch (e) {
         console.error('[MENU ERROR]', e)
         client.reply(m.chat, Func.texted('bold', '🚩 Gagal menampilkan menu. Silakan coba lagi.'), m)
      }
   },
   error: false,
   cooldown: 60,
   cache: true,
   location: __filename
}