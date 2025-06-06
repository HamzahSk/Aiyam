exports.run = {
   async: async (m, {
      client,
      groupSet,
      isAdmin,
      Func
   }) => {
      try {
         // Cek jika antitagsw mati atau pengirim adalah admin
         if (!groupSet.antitagsw || isAdmin) return

         // Deteksi khusus story mention (bukan tag all)
         const isStoryMention = /groupStatusMentionMessage/.test(m.mtype)
         if (!isStoryMention) return

         // Inisialisasi data member
         if (!groupSet.member) groupSet.member = {}
         const sender = m.sender
         if (!groupSet.member[sender]) groupSet.member[sender] = { warning: 0 }
         groupSet.member[sender].warning += 1

         // Hapus pesan
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
            await client.sendMessage(m.chat, { 
               text: `⚠️ *@${sender.split('@')[0]}* udah 3x mention story, dikick ya. 📵`, 
               mentions: [sender] 
            })
            await client.groupParticipantsUpdate(m.chat, [sender], 'remove')
            groupSet.member[sender].warning = 0
         } else {
            await client.sendMessage(m.chat, {
               text: `🚫 *Mention story terdeteksi!*\n` +
                     `❗ Jangan mention story WhatsApp di group!\n` +
                     `⚠️ Warning: ${warn}/3\n` +
                     `_Peringatan berikutnya akan berakibat kick_`,
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