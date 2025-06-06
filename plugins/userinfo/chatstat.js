exports.run = {
   usage: ['chatstat'],
   use: '[mention/reply] (opsional)',
   category: 'user info',
   async: async (m, { client, ctx, StoreR, Func, text }) => {
      let user = m.sender
      let isMentioned = false

      if (m.quoted) {
         user = m.quoted.sender
      } else if (text && text.includes('@')) {
         const mentioned = text.match(/\d{5,}@s\.whatsapp\.net/)
         if (mentioned) {
            user = mentioned[0]
            isMentioned = true
         }
      }

      const userName = user === m.sender ? 'Kamu' : '@' + user.split('@')[0]
      const pic = await client.profilePictureUrl(user, 'image').catch(() => null)

      // Total dari Redis
      const redisTotal = StoreR?.stats?.[user] || 0

      // Total dari DB
      const dbUserChat = global.db.chats.find(v => v.jid === user)
      const dbTotal = dbUserChat?.chat || 0

      // Total di grup (kalau dari grup)
      let groupTotal = 0
      if (m.isGroup) {
         const groupChat = global.db.chats.find(v => v.jid === m.chat)
         groupTotal = groupChat?.chat || 0
      }

      const caption = `乂  *C H A T - S T A T S*\n\n` +
         `◦  *${userName} udah kirim* : ${Func.formatNumber(redisTotal)} pesan ke bot (via Redis)\n` +
         `◦  *Total pesan tersimpan* : ${Func.formatNumber(dbTotal)} pesan (via Database)\n` +
         (m.isGroup ? `◦  *Total pesan grup ini* : ${Func.formatNumber(groupTotal)} pesan (via Database)\n\n` : `\n`) +
         global.footer

      client.sendMessageModify(m.chat, caption, m, {
         largeThumb: true,
         thumbnail: pic ? await Func.fetchBuffer(pic) : await Func.fetchBuffer('./media/image/default.jpg'),
         mentions: isMentioned ? [user] : []
      })
   },
   error: false,
   cache: true,
   location: __filename
}