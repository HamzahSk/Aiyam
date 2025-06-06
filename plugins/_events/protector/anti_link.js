exports.run = {
   async: async (m, {
      client,
      body,
      groupSet,
      isAdmin,
      Func
   }) => {
      try {
         const regex = /https?:\/\/(?:chat\.whatsapp\.com\/[A-Za-z0-9]+|whatsapp\.com\/channel\/[A-Za-z0-9]+|wa\.me\/\d+)/gi
         const sender = m.sender
         const isLinkDetected = (body?.match(regex) || m?.msg?.name?.match(regex))

         // cek kalau gak ada link / admin / antilink mati
         if (!isLinkDetected || isAdmin || !groupSet.antilink) return

         // inisialisasi data member
         if (!groupSet.member) groupSet.member = {}
         if (!groupSet.member[sender]) groupSet.member[sender] = { warning: 0 }
         groupSet.member[sender].warning += 1

         // hapus pesan
         try {
            await client.sendMessage(m.chat, {
               delete: {
                  remoteJid: m.chat,
                  fromMe: false,
                  id: m.key.id,
                  participant: sender
               }
            })
         } catch (err) {
            console.log('❌ Gagal hapus pesan:', err)
         }

         const warn = groupSet.member[sender].warning

         if (warn >= 3) {
            await client.sendMessage(m.chat, { text: `⚠️ *@${sender.split('@')[0]}* udah 3x ngirim link, dikick ya. 👋`, mentions: [sender] })
            await client.groupParticipantsUpdate(m.chat, [sender], 'remove')
            groupSet.member[sender].warning = 0
         } else {
            await client.sendMessage(m.chat, {
               text: `🚫 *Link terdeteksi!*\n❗ Warning: ${warn}/3`,
               mentions: [sender]
            })
         }

      } catch (e) {
         console.log(e)
         return client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   error: false,
   group: true,
   botAdmin: true,
   cache: true,
   location: __filename
}