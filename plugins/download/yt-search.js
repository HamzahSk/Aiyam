const yts = require('yt-search');

exports.run = {
   usage: ['ytsearch'],
   use: 'query',
   category: 'downloader',
   async: async (m, { client, args, text, Func }) => {
      try {
         if (!text) return client.reply(m.chat, 'Masukkan pencarian YouTube!\nContoh: .ytsearch Alan Walker Faded', m)
         
         client.sendReact(m.chat, '🕒', m.key)

         // Pake yt-search module
         const search = await yts(text);
         const videos = search.videos;

         if (!videos.length) return client.reply(m.chat, '❌ Tidak ditemukan hasil untuk pencarian ini.', m)

         await client.sendReact(m.chat, '✅', m.key)

         let list = '乂  *Y O U T U B E   S E A R C H*\n\n'
         videos.slice(0, 10).forEach((v, i) => {
            list += `${i + 1}. ${v.title}\n`
            list += `   ◦  *Durasi* : ${v.timestamp}\n`
            list += `   ◦  *Views* : ${Func.formatNumber(v.views)}\n`
            list += `   ◦  *Upload* : ${v.ago}\n`
            list += `   ◦  *Link* : ${v.url}\n\n`
         })
         list += global.footer

         await client.sendMessage(m.chat, {
            text: list,
            contextInfo: {
               externalAdReply: {
                  title: 'YouTube Search Results',
                  body: `Menampilkan ${videos.length} hasil pencarian`,
                  thumbnail: await Func.fetchBuffer(videos[0].thumbnail),
                  mediaType: 1,
                  sourceUrl: videos[0].url,
                  renderLargerThumbnail: true
               }
            }
         }, { quoted: m })

      } catch (e) {
         console.error(e)
         client.reply(m.chat, `❌ Error: ${e.message}`, m)
      }
   },
   error: false,
   limit: true,
   register: true,
   cache: true,
   location: __filename
}