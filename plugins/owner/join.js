exports.run = {
   usage: ['masuk'],
   hidden: ['join'],
   use: 'link grup',
   category: 'owner',
   async: async (m, {
      client,
      args,
      isPrefix,
      command,
      Func
   }) => {
      try {
         // Validasi input link grup
         if (!args || !args[0]) {
            const exampleLink = 'https://chat.whatsapp.com/INVITECODE123'
            return client.reply(m.chat, 
               Func.example(isPrefix, command, exampleLink) + 
               '\n\nPastikan link grup valid dan bot memiliki izin untuk bergabung.', 
               m
            )
         }

         // Ekstrak kode invite dari link
         const inviteRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
         const [_, code] = args[0].match(inviteRegex) || []
         
         if (!code) {
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 Format link grup tidak valid. Pastikan link mengandung chat.whatsapp.com'), 
               m
            )
         }

         // Proses bergabung ke grup
         const groupId = await client.groupAcceptInvite(code)
         
         if (!groupId.endsWith('g.us')) {
            return client.reply(m.chat, 
               Func.texted('bold', '🚩 Gagal bergabung ke grup. Mungkin link sudah kadaluarsa atau bot dibanned.'), 
               m
            )
         }

         // Dapatkan info grup
         const groupMetadata = await client.groupMetadata(groupId)
         const groupName = groupMetadata.subject
         const memberCount = groupMetadata.participants.length

         // Kirim laporan sukses
         const successMessage = `
✅ *BERHASIL BERGABUNG KE GRUP*

• Nama Grup : ${groupName}
• Jumlah Member : ${memberCount}
• ID Grup : ${groupId}

Bot siap melayani di grup ini!
         `.trim()

         await client.reply(m.chat, successMessage, m)

         // Kirim pesan sambutan ke grup
         const welcomeMessage = `
Halo semua! 👋

Saya adalah bot WhatsApp yang siap membantu di grup ini.

Ketik *.menu* untuk melihat daftar perintah yang tersedia.

Semoga harimu menyenangkan!
         `.trim()

         await client.sendMessage(groupId, { 
            text: welcomeMessage,
            mentions: groupMetadata.participants.map(p => p.id) 
         })

      } catch (e) {
         console.error('Error saat join grup:', e)
         return client.reply(m.chat, 
            Func.texted('bold', '🚩 Gagal bergabung ke grup. Error: ' + e.message), 
            m
         )
      }
   },
   owner: true,
   error: false,
   cache: true,
   location: __filename
}