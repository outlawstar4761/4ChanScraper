const chanScraper = require('./src/chanScraper');


(async ()=>{
  let targetHosts = chanScraper.config.availableDomains.filter((d)=>{return d.crawl});
  for(let i in targetHosts){
    chanScraper.setHost(targetHosts[i]);
    for(let j in targetHosts[i].targetBoards){
      await chanScraper.crawl(targetHosts[i].targetBoards[j]);
    }
  }
})();
