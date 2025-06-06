// plugins/accesscontrol.js
const fs = require('fs')

exports.run = {
   usage: ['addaccess', 'removeaccess'],
   hidden: ['addac', 'delac'],
   category: 'owner',
   async: async (m, {
      client,
      text,
      args,
      Func,
      ctx,
      env,
      command
   }) => {
      try {
         let target
         let cmdName
         const isAdd = command === 'addaccess' || command === 'addac'
         const isRemove = command === 'removeaccess' || command === 'delac'
         const actionType = isAdd ? 'add' : 'remove'

         if (m.quoted) {
            if (!args[0]) return client.reply(m.chat, '❌ Format salah! Contoh: .addaccess  commandname (reply pesan user)', m)
            target = client.decodeJid(m.quoted.sender)
            cmdName = args[0]
         } else if (m.mentionedJid.length) {
            if (!args[1]) return client.reply(m.chat, '❌ Format salah! Contoh: .addaccess @user commandname', m)
            target = client.decodeJid(m.mentionedJid[0])
            cmdName = args[1]
         } else if (text.includes('|')) {
            const [number, commandText] = text.split('|').map(v => v.trim())
            if (!number || !commandText) return client.reply(m.chat, '❌ Format salah! Contoh: .addaccess 628xxxxxx | commandname', m)

            const [check] = await client.onWhatsApp(number)
            if (!check?.exists) return client.reply(m.chat, '❌ Nomor tidak terdaftar di WhatsApp!', m)

            target = client.decodeJid(check.jid)
            cmdName = commandText
         } else {
            return client.reply(m.chat, '❌ Format salah! Gunakan reply, mention, atau manual.\nContoh:\n.addaccess @user command\n.addaccess 628xxxx | command\n.addaccess command (reply pesan)', m)
         }

         // Cek apakah command valid
         if (!ctx.commands.includes(cmdName)) 
            return client.reply(m.chat, `❌ Command *${cmdName}* gak ditemukan!`, m)

         let user = global.db.users.find(v => v.jid === target)
         if (!user) {
            user = { jid: target, allowedCommands: [] }
            global.db.users.push(user)
         }

         if (!user.allowedCommands) user.allowedCommands = []

         if (isAdd) {
            if (user.allowedCommands.includes(cmdName)) 
               return client.reply(m.chat, '⚠️ User udah punya akses ke command itu.', m)
            user.allowedCommands.push(cmdName)
         } else if (isRemove) {
            if (!user.allowedCommands.includes(cmdName)) 
               return client.reply(m.chat, '❌ User belum punya akses ke command itu.', m)
            user.allowedCommands = user.allowedCommands.filter(cmd => cmd !== cmdName)
         }

         if (!global.db.Logs.access) global.db.Logs.access = []
         global.db.Logs.access.push({
            action: actionType,
            user: target.split('@')[0],
            command: cmdName,
            date: new Date().toLocaleString('id-ID', { timeZone: env.Timezone })
         })

         const actionMsg = isAdd
            ? `✅ Akses *${cmdName}* ditambahin ke @${target.split('@')[0]}`
            : `🗑️ Akses *${cmdName}* dicabut dari @${target.split('@')[0]}`

         await client.sendReact(m.chat, '✅', m.key)
         client.reply(m.chat, Func.texted('bold', `${actionMsg}\n📅 ${new Date().toLocaleString('id-ID', { timeZone: env.Timezone })}`), m, {
            mentions: [target]
         })

      } catch (e) {
         console.error('[ERROR] AccessControl:', e)
         client.reply(m.chat, Func.texted('bold', `❌ Error: ${e.message}`), m)
      }
   },
   owner: true,
   cache: true,
   location: __filename
}