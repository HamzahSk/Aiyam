exports.run = {
   async: async (m, {
      client,
      Func,
      groupMetadata,
      groupSet
   }) => {
      try {
         // Check schedules every minute
         setInterval(async () => {
            // Get current time in Asia/Jakarta timezone
            const options = {
               timeZone: 'Asia/Jakarta',
               hour12: false,
               hour: '2-digit',
               minute: '2-digit'
            };
            const jakartaTime = new Date().toLocaleTimeString('en-US', options);
            const [currentHours, currentMinutes] = jakartaTime.split(':');
            const currentTime = `${currentHours}:${currentMinutes}`;
            
            // Process all groups with schedules
            for (const group of global.db.groups) {
               if (!group.jadwal || group.jadwal.length === 0) continue;
               
               for (const schedule of group.jadwal) {
                  if (schedule.time === currentTime) {
                     try {
                        // Execute the scheduled action
                        await client.groupSettingUpdate(
                           group.jid, 
                           schedule.action === 'open' ? 'not_announcement' : 'announcement'
                        );
                        
                        // Send notification to group
                        await client.sendMessage(
                           group.jid, 
                           { text: `*[Jadwal Otomatis]*\nGrup telah di-${schedule.action === 'open' ? 'buka' : 'tutup'} sesuai jadwal.\n⏰ Waktu: ${currentTime} WIB`}
                        );
                        
                        // Optional: Remove the executed schedule to prevent repeats
                        // group.jadwal = group.jadwal.filter(s => !(s.action === schedule.action && s.time === schedule.time));
                     } catch (e) {
                        console.error(`Gagal menjalankan jadwal untuk grup ${group.jid}:`, e);
                        await client.sendMessage(
                           group.jid, 
                           { text: `*[Jadwal Error]*\nGagal ${schedule.action === 'open' ? 'membuka' : 'menutup'} grup.\n⚠ Error: ${e.message}`}
                        );
                     }
                  }
               }
            }
         }, 1000 * 60); // Check every minute
      } catch (e) {
         console.error('Error in jadwal scheduler:', e);
         return client.reply(m.chat, Func.jsonFormat(e), m);
      }
   },
   error: false,
   cache: true,
   location: __filename
};