let mod = (function(){
  const request = require('request');
  const fs = require('fs');
  const host = 'https://archive.4plebs.org';
  const JSSoup = require('jssoup').default;
  const config = require('./config');
  const targetDomain = 'https://archive.4plebs.org';
  const mediaFormats = [".jpg", ".png", ".gif", ".webm"];
  const thread_link_length = 17; //might be unused. Grabbed from source
  let board = 'pol';
  let outputDir = config.outputDir;
  function _get(uri){
    return new Promise((resolve,reject)=>{
      request(uri,(err,res,body)=>{
        if(err){
          reject(err);
          return;
        }
        resolve(body);
      });
    });
  }
  function _buildPath(threadId){
    return outputDir + board + '/' + thread + '/';
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
      console.log(a);
      for(let i in mediaFormats){
        if(a.includes(mediaFormats[i])){
          return true;
        }
      }
      return false;
    }).map((a)=>{
      return a.includes('http') ? a:'https:' + a;
    });
  }
  function _downloadFile(targetDir,uri){
    let fileName = targetDir + uri.split('/' + board + '/')[1];
    request.get(uri).pipe(fs.createWriteStream(fileName));
  }
  function _parseMedia(html){
    let anchors = _parseAnchors(html);
    console.log(anchors);
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
    return soup.findAll('div','text');
    // console.log(posts);
  }
  function _parseText(html){
    let title = _parseTitle(html);
    let posts = _parsePosts(html);
    posts.forEach((p)=>{console.log(p.contents[0]._text);});
    // console.log(posts);
  }
  async function _crawlPage(uri){
    let html = await _get(uri);
    let threads = _parseThreads(html).map((threadId)=>{return targetDomain + '/' + board + '/thread/' + threadId});
    threads.forEach(_crawlThread);
  }
  async function _crawlThread(uri){
    let html = await _get(uri);
    // _parseMedia(html);
    _parseText(html);
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
      //let pages = _getPages(board);
      //pages.forEach(_crawlPage);
      _crawlThread('https://archive.4plebs.org/pol/thread/302085101');
      /*
      build pages.
      get each page.
      get each thread.
      visit each thread on each page.
      */
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
