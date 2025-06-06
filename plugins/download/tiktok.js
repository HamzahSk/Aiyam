exports.run = {
   usage: ['tiktok', 'tikmp3', 'tikwm'],
   hidden: ['tt', 'tiktokmp3', 'tiktokwm', 'ttwm', 'ttmp3'],
   use: 'link',
   category: 'downloader',
   async: async (m, {
      client,
      args,
      command,
      Func,
      users,
      env
   }) => {
      try {
         if (!args[0]) return client.reply(m.chat, Func.example('!', command, 'https://vm.tiktok.com/ZMkMuEmmd'), m)
         
         // Validasi URL TikTok
         if (!/(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/.test(args[0])) {
            return client.reply(m.chat, '❌ URL TikTok tidak valid! Contoh: https://vm.tiktok.com/ZMkMuEmmd', m)
         }

         client.sendReact(m.chat, '🕒', m.key)

         // Gunakan API TiklyDown
         const apiUrl = `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(args[0])}`
         const response = await Func.fetchJson(apiUrl)
         
         if (!response.video || !response.music) throw new Error('Gagal mendapatkan data dari TikTok')

         await client.sendReact(m.chat, '⏳', m.key)

         // Tentukan URL download berdasarkan command
         const isMP3 = command.includes('mp3')
         const isWM = command.includes('wm')
         const downloadUrl = isMP3 ? response.music.play_url : (isWM ? response.video.watermark : response.video.noWatermark)

         if (!downloadUrl) throw new Error('Link download tidak ditemukan')

         // Validasi ukuran file
         const fileSize = await Func.getfilesize(downloadUrl).catch(() => 0)
         const maxSize = users.premium ? env.max_upload : env.max_upload_free
         
         if (fileSize > maxSize) {
            return client.reply(m.chat, 
               `📁 Ukuran file: ${fileSize}MB\n` +
               `❌ Melebihi batas (Maksimal: ${maxSize}MB${users.premium ? '' : ', upgrade premium!'})`, 
               m
            )
         }

         // Bangun caption
         const caption = `乂  *T I K T O K - ${isMP3 ? 'A U D I O' : 'V I D E O'}*\n\n` +
                        `◦  *Judul* : ${response.title || '-'}\n` +
                        `◦  *Penulis* : ${response.author?.name || '-'}\n` +
                        `◦  *Durasi* : ${response.video?.durationFormatted || '-'}\n\n` +
                        `乂  *S T A T I S T I K*\n` +
                        `◦  ❤️ : ${response.stats?.likeCount || 0}\n` +
                        `◦  💬 : ${response.stats?.commentCount || 0}\n` +
                        `◦  ↪️ : ${response.stats?.shareCount || 0}\n` +
                        `◦  ▶️ : ${response.stats?.playCount || 0}\n\n` +
                        global.footer

         // Kirim file
         if (isMP3) {
            await client.sendMessage(m.chat, { 
               audio: { url: downloadUrl },
               mimetype: 'audio/mpeg',
               contextInfo: {
                  externalAdReply: {
                     title: response.title.substring(0, 60),
                     body: `TikTok Audio Success!`,
                     thumbnailUrl: response.music.cover_large || response.author.avatar,
                     sourceUrl: args[0],
                     mediaType: 1
                  }
               }
            }, { quoted: m })
         } else {
            await client.sendMessage(m.chat, { 
               video: { url: downloadUrl },
               caption: caption,
               mimetype: 'video/mp4',
               contextInfo: {
                  externalAdReply: {
                     title: response.title.substring(0, 60),
                     body: `TikTok Video Success!`,
                     thumbnailUrl: response.video.cover || response.author.avatar,
                     sourceUrl: args[0],
                     mediaType: 1
                  }
               }
            }, { quoted: m })
         }

         await client.sendReact(m.chat, '✅', m.key)

      } catch (e) {
         console.error(e)
         client.reply(m.chat, `❌ Error: ${e.message}`, m)
         client.sendReact(m.chat, '❌', m.key)
      }
   },
   error: false,
   limit: true,
   cache: true,
   location: __filename
}