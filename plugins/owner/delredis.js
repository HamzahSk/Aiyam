const { redis, redisConnected } = require('../../lib/system/redis')

exports.run = {
   usage: ['delredis'],
   use: 'reply sender',
   category: 'owner',
   async: async (m, {
      client,
      text,
      ctx
   }) => {
      const jid = m.quoted.sender
      
      try {
        await redis.del(`store:${jid}`)
         m.reply('Chat berhasil dibersihin dari WA!')
      } catch (err) {
         m.reply('Gagal bersihin chat. Cek log ya.')
      }
   },
   owner: true,
   cache: true,
   location: __filename
}