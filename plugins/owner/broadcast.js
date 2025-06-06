exports.run = {
   usage: ['bc', 'bcgc'],
   use: 'teks atau balas media',
   category: 'owner',
   async: async (m, {
      client,
      env,
      text,
      command,
      Func
   }) => {
      try {
         // Variabel dasar
         const MAX_PRIVATE_CHATS = 100 // Batas maksimal chat pribadi
         let q = m.quoted ? m.quoted : m
         let mime = (q.msg || q).mimetype || ''
         
         // Mendapatkan daftar penerima
         let chatJid = global.db.chats
            .filter(v => v.jid && v.jid.endsWith('.net'))
            .map(v => v.jid)
            .slice(0, MAX_PRIVATE_CHATS) // Batasi untuk chat pribadi
         
         let groupList = async () => Object.entries(await client.groupFetchAllParticipating())
            .slice(0)
            .map(entry => entry[1])
         
         let groupJid = await (await groupList()).map(v => v.id)
         const id = command == 'bc' ? chatJid : groupJid
         
         // Validasi penerima
         if (id.length == 0) return client.reply(m.chat, Func.texted('bold', `❌ Gagal, tidak ada ID yang ditemukan.`), m)
         
         // Tanda sedang memproses
         client.sendReact(m.chat, '⏳', m.key)
         
         // Fungsi untuk menambahkan header broadcast
         const addBroadcastHeader = (text) => {
            return `📢 *P E S A N  B R O A D C A S T*\n` +
                   `━━━━━━━━━━━━━━━━━━━\n` +
                   `${text}\n\n` +
                   `📡 Dikirim oleh: ${env.bot_name}`
         }

         // Broadcast teks
         if (text) {
            for (let jid of id) {
               await Func.delay(1500)
               await client.sendMessageModify(jid, addBroadcastHeader(text), null, {
                  title: `📢 ${global.botname} - Broadcast`,
                  thumbnail: await Func.fetchBuffer('https://telegra.ph/file/aa76cce9a61dc6f91f55a.jpg'),
                  largeThumb: true,
                  url: global.db.setting.link,
                  mentions: command == 'bcgc' ? await (await client.groupMetadata(jid)).participants.map(v => v.id) : []
               })
            }
            client.reply(m.chat, Func.texted('bold', `✅ Berhasil mengirim broadcast ke ${id.length} ${command == 'bc' ? 'chat pribadi' : 'grup'}`), m)
         
         // Broadcast stiker
         } else if (/image\/(webp)/.test(mime)) {
            for (let jid of id) {
               await Func.delay(1500)
               let media = await q.download()
               await client.sendSticker(jid, media, null, {
                  packname: global.db.setting.sk_pack,
                  author: global.db.setting.sk_author,
                  mentions: command == 'bcgc' ? await (await client.groupMetadata(jid)).participants.map(v => v.id) : []
               })
            }
            client.reply(m.chat, Func.texted('bold', `✅ Berhasil mengirim stiker ke ${id.length} ${command == 'bc' ? 'chat pribadi' : 'grup'}`), m)
         
         // Broadcast gambar/video
         } else if (/video|image\/(jpe?g|png)/.test(mime)) {
            for (let jid of id) {
               await Func.delay(1500)
               let media = await q.download()
               await client.sendFile(jid, media, '', addBroadcastHeader(q.text || ''), null, null,
                  command == 'bcgc' ? {
                     contextInfo: {
                        mentionedJid: await (await client.groupMetadata(jid)).participants.map(v => v.id)
                     }
                  } : {})
            }
            client.reply(m.chat, Func.texted('bold', `✅ Berhasil mengirim media ke ${id.length} ${command == 'bc' ? 'chat pribadi' : 'grup'}`), m)
         
         // Broadcast audio
         } else if (/audio/.test(mime)) {
            for (let jid of id) {
               await Func.delay(1500)
               let media = await q.download()
               await client.sendFile(jid, media, '', addBroadcastHeader(''), null, null,
                  command == 'bcgc' ? {
                     ptt: q.ptt,
                     contextInfo: {
                        mentionedJid: await (await client.groupMetadata(jid)).participants.map(v => v.id)
                     }
                  } : {})
            }
            client.reply(m.chat, Func.texted('bold', `✅ Berhasil mengirim audio ke ${id.length} ${command == 'bc' ? 'chat pribadi' : 'grup'}`), m)
         
         } else {
            client.reply(m.chat, Func.texted('bold', `❌ Media/teks tidak ditemukan atau format tidak didukung.`), m)
         }
      } catch (e) {
         console.error('Broadcast Error:', e)
         client.reply(m.chat, Func.texted('bold', `❌ Terjadi kesalahan saat broadcast:\n${e.message}`), m)
      }
   },
   owner: true
}