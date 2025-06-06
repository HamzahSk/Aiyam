const fs = require('fs')
const path = require('path')

exports.run = {
   usage: ['getplugin'],
   use: 'command',
   category: 'owner',
   async: async (m, { client, text, Func }) => {
      try {
         if (!text) return client.reply(m.chat, 'Masukin nama command-nya, contoh: *.getplugin rvo*', m)
         const basePath = path.join(__dirname, '../')
         let targetFile = null

         const walk = dir => {
            const files = fs.readdirSync(dir)
            for (const file of files) {
               const filepath = path.join(dir, file)
               const stat = fs.statSync(filepath)
               if (stat.isDirectory()) {
                  walk(filepath) // rekursif ke subfolder
               } else if (file.endsWith('.js')) {
                  const plugin = require(filepath)
                  const usage = plugin?.run?.usage || []
                  const hidden = plugin?.run?.hidden || []
                  if ([...usage, ...hidden].includes(text.toLowerCase())) {
                     targetFile = filepath
                     break
                  }
               }
               if (targetFile) break
            }
         }

         walk(basePath)

         if (!targetFile) return client.reply(m.chat, 'Command ga ketemu di plugin manapun.', m)

         const buffer = fs.readFileSync(targetFile)
         await client.sendFile(m.chat, buffer, path.basename(targetFile), '', m)

      } catch (e) {
         console.log(e)
         client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   owner: true,
   cache: true,
   location: __filename
}