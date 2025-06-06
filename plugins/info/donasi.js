exports.run = {
   usage: ['donasi'],
   category: 'info',
   async: async (m, { client, Func }) => {
      try {
         const cover = global.db.setting.cover
         
         const cards = [
            {
               header: {
                  imageMessage: await Func.fetchBuffer("https://tmpfiles.org/dl/28404725/tmp.jpg"),
                  hasMediaAttachment: true,
               },
               body: {
                  text: "Bantu support project ini lewat OVO ya!"
               },
               nativeFlowMessage: {
                  buttons: [{
                     name: "cta_copy",
                     buttonParamsJson: JSON.stringify({
                        display_text: 'Salin Nomor OVO',
                        copy_code: '081234567890'
                     })
                  }]
               }
            },
            {
               header: {
                  imageMessage: await Func.fetchBuffer("https://tmpfiles.org/dl/28404927/tmp.jpg"),
                  hasMediaAttachment: true,
               },
               body: {
                  text: "Dukung kami lewat DANA juga bisa!"
               },
               nativeFlowMessage: {
                  buttons: [{
                     name: "cta_copy",
                     buttonParamsJson: JSON.stringify({
                        display_text: 'Salin Nomor DANA',
                        copy_code: '081234567891'
                     })
                  }]
               }
            },
            {
               header: {
                  imageMessage: await Func.fetchBuffer("https://tmpfiles.org/dl/28404816/tmp.jpg"),
                  hasMediaAttachment: true,
               },
               body: {
                  text: "Pake GoPay juga ready!"
               },
               nativeFlowMessage: {
                  buttons: [{
                     name: "cta_copy",
                     buttonParamsJson: JSON.stringify({
                        display_text: 'Salin Nomor GoPay',
                        copy_code: '081234567892'
                     })
                  }]
               }
            },
            {
               header: {
                  imageMessage: await Func.fetchBuffer(cover), // cover harus link image juga
                  hasMediaAttachment: true,
               },
               body: {
                  text: "LinkAja juga bisa dipake!"
               },
               nativeFlowMessage: {
                  buttons: [{
                     name: "cta_copy",
                     buttonParamsJson: JSON.stringify({
                        display_text: 'Salin Nomor LinkAja',
                        copy_code: '081234567893'
                     })
                  }]
               }
            },
            {
               header: {
                  imageMessage: await Func.fetchBuffer("https://tmpfiles.org/dl/28405022/tmp.jpg"),
                  hasMediaAttachment: true,
               },
               body: {
                  text: "Scan QRIS juga bisa buat donasi cepat!"
               },
               nativeFlowMessage: {
                  buttons: [{
                     name: "cta_copy",
                     buttonParamsJson: JSON.stringify({
                        display_text: 'Salin ID QRIS',
                        copy_code: '123456789012345'
                     })
                  }]
               }
            },
         ]

         await client.sendCarousel(m.chat, cards, m, {
            content: 'Makasih udah mau support! Pilih salah satu metode donasi dan salin kodenya ya:'
         })
      } catch (e) {
         console.log(e)
         client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   error: false,
   cache: true,
   location: __filename
}