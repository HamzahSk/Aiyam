const decode = require('html-entities').decode
exports.run = {
   regex: /^(?:https?:\/\/)?(?:www\.)?(?:mediafire\.com\/)(?:\S+)?$/,
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
         const regex = /^(?:https?:\/\/)?(?:www\.)?(?:mediafire\.com\/)(?:\S+)?$/;
         const extract = body ? Func.generateLink(body) : null
         if (extract) {
            const links = extract.filter(v => v.match(regex))
            if (links.length !== 0) {
               if (users.limit > 0) {
                  let limit = 1
                  if (users.limit >= limit) {
                     users.limit -= limit
                  } else return client.reply(m.chat, Func.texted('bold', `🚩 Limit lo gak cukup buat pake fitur ini.`), m)
               }
               client.sendReact(m.chat, '🕒', m.key)
               Func.hitstat('mediafire', m.sender)
               links.map(async link => {
                  let json = await Scraper.mediafireDl(link).catch(() => null)
                  if (!json || !json.link) return client.reply(m.chat, global.status.fail, m)

                  let text = `乂  *M E D I A F I R E*\n\n`
                  text += '	◦  *Name* : ' + unescape(decode(json.name)) + '\n'
                  text += '	◦  *Size* : ' + json.size + '\n'
                  text += '	◦  *Type* : ' + json.type + '\n'
                  text += '	◦  *Uploaded* : ' + json.upload_date + '\n\n'
                  text += global.footer

                  const chSize = Func.sizeLimit(json.size, users.premium ? env.max_upload : env.max_upload_free)
                  const isOver = users.premium
                     ? `💀 File size (${json.size}) exceeds the maximum limit.`
                     : `⚠️ File size (${json.size}), kamu cuma bisa download maksimal ${env.max_upload_free} MB, premium max ${env.max_upload} MB.`

                  if (chSize.oversize) return client.reply(m.chat, isOver, m)

                  client.sendMessageModify(m.chat, text, m, {
                     largeThumb: true,
                     thumbnail: 'https://telegra.ph/file/fcf56d646aa059af84126.jpg'
                  }).then(async () => {
                     client.sendFile(m.chat, json.link, unescape(decode(json.name)), '', m)
                  })
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