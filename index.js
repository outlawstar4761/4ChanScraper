const chanScraper = require('./src/chanScraper');


(async ()=>{
  chanScraper.targetBoards.forEeach(chanScraper.crawl);
  // chanScraper.crawl('pol');
})();
