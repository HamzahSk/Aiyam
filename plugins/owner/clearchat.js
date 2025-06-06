const { redis, redisConnected } = require('../../lib/system/redis')

exports.run = {
   usage: ['clearchat'],
   use: 'bersihkanchat',
   category: 'owner',
   async: async (m, {
      client,
      text,
      ctx
   }) => {
      const jid = m.chat

      // Pastikan ada message terakhir di chat ini
      const messages = ctx.store?.messages?.[jid]
      if (!messages || messages.length === 0) {
         return m.reply('Gak nemu pesan buat dihapus kak.')
      }

      // Ambil message terakhir
      const lastMsg = messages[messages.length - 1]
      if (!lastMsg?.key || !lastMsg?.messageTimestamp) {
         return m.reply('Gagal dapet pesan terakhir.')
      }

      // Hapus chat dari WhatsApp (clear chat)
      try {
         await client.chatModify({
            delete: true,
            lastMessages: [{
               key: lastMsg.key,
               messageTimestamp: lastMsg.messageTimestamp
            }]
         }, jid)
        await redis.del(`store:${jid}`)
         m.reply('Chat berhasil dibersihin dari WA!')
      } catch (err) {
         console.log('Gagal clear chat:', err)
         m.reply('Gagal bersihin chat. Cek log ya.')
      }
   },
   owner: true,
   cache: true,
   location: __filename
}