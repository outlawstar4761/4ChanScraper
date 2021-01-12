let mod = (function(){
  // const request = require('request');
  const fs = require('fs');
  const https = require('https');
  const host = 'https://archive.4plebs.org';
  const JSSoup = require('jssoup').default;
  const config = require('../config');
  const targetDomain = 'https://archive.4plebs.org';
  const mediaFormats = [".jpg", ".png", ".gif", ".webm"];
  const thread_link_length = 17; //might be unused. Grabbed from source
  let board = 'pol';
  let outputDir = config.outputDir;
  function _get(uri){
    return new Promise((res,rej)=>{
      https.get(uri,(resp)=>{
        let data = '';
        resp.on('data',(chunk)=>{
          data += chunk;
        });
        resp.on('error',rej);
        resp.on('end',()=>{
          res(data);
        });
      });
    });
  }
  function _getToFile(absolutePath,uri){
    https.get(uri,(resp)=>{
      resp.pipe(fs.createWriteStream(absolutePath));
    });
  }
  function _unique(value, index, self){
    return self.indexOf(value) === index;
  }
  function _buildThreadPath(threadId){
    return outputDir + board + '/' + threadId + '/';
  }
  function _buildBoardPath(){
    return outputDir + board;
  }
  function _prepDir(dir){
    if (!fs.existsSync(dir)){
      try{
        fs.mkdirSync(dir);
      }catch(e){
        console.error(e);
      }
    }
  }
  function _buildPage(board,page){
    if(pageNum === 0){
      return targetDomain + '/' + board + '/';
    }
    return targetDomain + '/' + board + '/page/' + page;
  }
  function _getPages(board){
    let pages = [];
    for(let i = 0; i <= 15; i++){
      pages.push(targetDomain + '/' + board + '/page/' + i);
    }
    return pages;
  }
  function _parseThreads(html){
    let soup = new JSSoup(html);
    return threads = soup.findAll('article').filter((thread)=>{return thread.attrs['data-thread-num'] !== undefined}).map((thread)=>{return thread.attrs['data-thread-num']});
  }
  function _parseAnchors(html){
    let soup = new JSSoup(html);
    return soup.findAll('a').filter((a)=>{
      return a.attrs['href'] !== undefined;
    }).map((a)=>{
      return a.attrs['href'];
    }).filter((a)=>{
      for(let i in mediaFormats){
        if(a.includes(mediaFormats[i])){
          return true;
        }
      }
      return false;
    }).map((a)=>{
      return a.includes('http') ? a:'https:' + a;
    }).map((a)=>{
      return a.split('http').length > 2 ? 'http' + a.split('http')[2]:'http' + a.split('http')[1];
    }).filter(_unique);
  }
  function _downloadFile(targetDir,uri){
    let fileName = targetDir + uri.split('/')[uri.split('/').length - 1];
    _getToFile(fileName,uri);
  }
  function _saveHtml(targetDir,uri){
    let fileName = targetDir + uri.split('/thread/')[1] + '.html';
    _getToFile(fileName,uri);
  }
  function _parseMedia(threadDir,html){
    let anchors = _parseAnchors(html);
    for(let i in anchors){
      _downloadFile(threadDir,anchors[i]);
    }
  }
  function _parseTitle(html){
    let soup = new JSSoup(html);
    let title = soup.find('h2', 'post_title').contents;
    if(title.length){
      return title[0]._text;
    }
    return '';
  }
  function _parsePosts(html){
    let soup = new JSSoup(html);
    let posts = soup.findAll('div','text');
    return posts.filter((p)=>{
      return p.contents.length;
    }).map((p)=>{
      if(p.contents[p.contents.length - 1]._text === undefined){ //includes a link or something
        console.log(p.contents);
      }
      return p.contents[p.contents.length - 1]._text; //plain text -- seems to work for most posts
      //p.contents[p.contents.length - 1]._text   greentext?
    });
  }
  function _parseText(html){
    /*
    Wanted some kind of structure.
    for the sake of time, we'll save the whole html
    */
    //let title = _parseTitle(html);
    //let posts = _parsePosts(html);
  }
  async function _crawlPage(uri){
    let html = await _get(uri);
    let threads = _parseThreads(html).map((threadId)=>{return targetDomain + '/' + board + '/thread/' + threadId});
    if(threads.length){
      threads.forEach(_crawlThread);
      return true;
    }
    return false;
  }
  async function _crawlThread(uri){
    let html = await _get(uri);
    let threadId = uri.split('/thread/')[1];
    let threadDir = _buildThreadPath(threadId);
    _prepDir(threadDir);
    console.log('Crawling Thread: ' + threadId);
    _saveHtml(threadDir,uri);
    _parseMedia(threadDir,html);
    // _parseText(html);
  }
  return {
    urlBase:targetDomain,
    board:board,
    test:function(uri){
      return _downloadFile('./data/',uri);
    },
    board:function(targetBoard){
      this.board = targetBoard;
      board = this.board;
      return this.board;
    },
    crawl:async function(targetBoard){
      this.board(targetBoard);
      _prepDir(_buildBoardPath(targetBoard));
      // let paginating = true;
      // pageNum = 2
      // while(paginating){
      //   let page = _buildPage(targetBoard,pageNum);
      //   if(!await _crawlPage(page)){
      //     console.log('No threads on page: ' + pageNum + '. Stopping.');
      //     paginating = false;
      //   }
      //   page++;
      // }
      _crawlThread('https://archive.4plebs.org/pol/thread/302085101');
      // pages.forEach(_crawlPage);
    }
  }


}());

module.exports = mod;

/*
getting posts:
page: h2 class="post_title"
div class="text"
soup.findAll('div','text');
//data-post == postId
*/

/*
soup.findAll('h2', 'post_title')
// [<div class="h1"></div>]
*/
//https://archive.4plebs.org/pol/thread/302045542/ NO TITLE
//https://archive.4plebs.org/pol/thread/302085101 WITH TITLE
