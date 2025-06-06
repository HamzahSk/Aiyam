exports.run = {
   usage: ['everyone'],
   hidden: ['tagall'],
   use: 'teks (opsional)',
   category: 'admin tools',
   async: async (m, {
      client,
      text,
      participants,
      Func
   }) => {
      try {
         let member = participants.filter(v => v.id).map(v => v.id) // filter biar id nya bener
         let readmore = String.fromCharCode(8206).repeat(4001)
         let groupName = (await client.groupMetadata(m.chat)).subject
         let message = (!text)
            ? `📣 HALO WARGA GRUP *${groupName}*!`
            : `📢 PESAN DARI ADMIN:\n\n🗣️ "${text}"`
         
         let mentionText = member.map(v => `👤 @${v.replace(/@.+/, '')}`).join('\n')

         client.reply(
            m.chat,
            `📣 *PANGGILAN MASSAL!* 📣\n\n${message}\n\n${readmore}\n${mentionText}`,
            m,
            { mentions: member }
         )
      } catch (e) {
         console.log(e)
         return client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   admin: true,
   group: true
}