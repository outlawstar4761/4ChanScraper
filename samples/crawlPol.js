const chanScraper = require('./src/chanScraper');


(async ()=>{
  // let html = await testModule.test(target + '/pol');
  // console.log(html);
  //data-thread-num
  // testModule.test('http://iqdb.org/?url=https://i.4pcdn.org/pol/1610409255689s.jpg');
  // testModule.test('http://saucenao.com/search.php?url=https://i.4pcdn.org/pol/1610397941691s.jpg');
  testModule.crawl('pol');
  // console.log(tag);
})();

//Good link
//https://i.4pcdn.org/pol/1601047796828.jpg
