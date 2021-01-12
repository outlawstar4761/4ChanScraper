const chanScraper = require('./src/chanScraper');


(async ()=>{
  for(let i in chanScraper.targetBoards){
    chanScraper.crawl(chanScraper.targetBoards[i]);
  }
})();
