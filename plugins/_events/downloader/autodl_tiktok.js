exports.run = {
   regex: /^(?:https?:\/\/)?(?:www\.|vt\.|vm\.|t\.)?(?:tiktok\.com\/)(?:\S+)?$/,
   async: async (m, {
      client,
      body,
      users,
      setting,
      prefixes,
      Func,
      isPrem,
      Scraper
   }) => {
      try {
         const regex = /^(?:https?:\/\/)?(?:www\.|vt\.|vm\.|t\.)?(?:tiktok\.com\/)(?:\S+)?$/;
         const extract = body ? Func.generateLink(body) : null;
         if (extract) {
            const links = extract.filter(v => Func.ttFixed(v).match(regex));
            if (links.length !== 0) {
               if (users.limit > 0) {
                  const limit = 1;
                  if (users.limit >= limit) {
                     users.limit -= limit;
                  } else return client.reply(m.chat, Func.texted('bold', `🚩 Limit lo abis cuy.`), m);
               }
               client.sendReact(m.chat, '🕒', m.key);
               const old = new Date();
               Func.hitstat('tiktok', m.sender);

               links.map(async link => {
                  const json = await Scraper.tiktokDl(Func.ttFixed(link));
                  if (!json.status) return m.reply(Func.jsonFormat(json));

                  const hd = json.data.find(v => v.type === 'nowatermark_hd');
                  const nowm = json.data.find(v => v.type === 'nowatermark');

                  const finalUrl = nowm?.url || hd?.url

                  if (finalUrl) {
                     return client.sendFile(m.chat, finalUrl, 'tiktok.mp4', `🍟 *Fetched in* : ${((new Date - old) * 1)} ms`, m);
                  } else {
                     return client.reply(m.chat, '❌ Ga nemu video no watermark-nya.', m);
                  }
               });
            }
         }
      } catch (e) {
         return client.reply(m.chat, Func.jsonFormat(e), m);
      }
   },
   limit: true,
   download: true
};