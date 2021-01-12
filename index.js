const testModule = require('./testModule');


const target = 'https://archive.4plebs.org';


(async ()=>{
  // let html = await testModule.test(target + '/pol');
  // console.log(html);
  //data-thread-num
  // testModule.test('http://saucenao.com/search.php?url=https://i.4pcdn.org/pol/1610397941691s.jpg');
  testModule.crawl('pol');
  // console.log(tag);
})();
