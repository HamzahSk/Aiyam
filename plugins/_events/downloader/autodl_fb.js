exports.run = {
   regex: /^(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/,
   async: async (m, {
      client,
      body,
      users,
      setting,
      env,
      Func,
      Scraper
   }) => {
      try {
         const regex = /^(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/;
         const extract = body ? Func.generateLink(body) : null
         if (extract) {
            const links = extract.filter(v => v.match(regex))
            if (links.length != 0) {
               if (users.limit > 0) {
                  let limit = 1
                  if (users.limit >= limit) {
                     users.limit -= limit
                  } else return client.reply(m.chat, Func.texted('bold', `🚩 Limit lo kurang buat pake fitur ini.`), m)
               }
               client.sendReact(m.chat, '🕒', m.key)
               Func.hitstat('fb', m.sender)
               links.map(async link => {
                  let json = await Scraper.facebookDl(link)
                  if (!json || !json.results || json.results.length == 0) return client.reply(m.chat, global.status.fail, m)

                  let hd = json.results.find(v => v.type === 'HD' && v.url)
                  let sd = json.results.find(v => v.type === 'SD' && v.url && v.quality == 360)

                  if (hd) {
                     let size = await Func.getSize(hd.url)
                     let chSize = Func.sizeLimit(size, 15) // Batas 15MB
                     if (!chSize.oversize) {
                        return client.sendFile(m.chat, hd.url, Func.filename('mp4'), `◦ *Quality* : HD\n◦ *Size* : ${size}`, m)
                     }
                  }

                  if (sd) {
                     let size = await Func.getSize(sd.url)
                     let chSize = Func.sizeLimit(size, users.premium ? env.max_upload : env.max_upload_free)
                     if (chSize.oversize) {
                        const short = await (await Scraper.shorten(sd.url)).data.url
                        return client.reply(m.chat, `⚠️ Ukuran file (${size}) melebihi batas. Download manual aja ya:\n${short}`, m)
                     }
                     return client.sendFile(m.chat, sd.url, Func.filename('mp4'), `◦ *Quality* : SD (360p)\n◦ *Size* : ${size}`, m)
                  }

                  return client.reply(m.chat, global.status.fail, m)
               })
            }
         }
      } catch (e) {
         return client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   limit: true,
   download: true
}