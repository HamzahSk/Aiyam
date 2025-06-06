exports.run = {
   usage: ['instadl'],
   hidden: ['igdl', 'ig'],
   use: 'link',
   category: 'downloader',
   async: async (m, {
      client,
      args,
      isPrefix,
      command,
      Func
   }) => {
      try {
         if (!args || !args[0]) return client.reply(m.chat, Func.example(isPrefix, command, 'https://www.instagram.com/reel/DKTeBoAyazO/'), m)
         if (!args[0].match(/(https:\/\/www.instagram.com)/gi)) return client.reply(m.chat, global.status.invalid, m)

         client.sendReact(m.chat, '🕒', m.key)
         let old = new Date()

         // fetch dari API ryzumi
         const res = await Func.fetchJson(`https://api-02.ryzumi.vip/api/downloader/igdl?url=${encodeURIComponent(args[0])}`)

         if (!res.status || !res.data || res.data.length === 0) {
            return client.reply(m.chat, `⚠️ Gagal dapetin data, pastiin link IG nya bener ya.`, m)
         }

         for (let v of res.data) {
            client.sendFile(m.chat, v.url, Func.filename('mp4'), `📥 *Berhasil!* (${((new Date - old) * 1)} ms)`, m)
            await Func.delay(1500)
         }
         
      } catch (e) {
         console.log(e)
         return client.reply(m.chat, `❌ Error:\n${e.message}`, m)
      }
   },
   error: false,
   limit: true,
   cache: true,
   cooldown: 30,
   location: __filename
}