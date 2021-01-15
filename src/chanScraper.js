let mod = (function(){
  // const request = require('request');
  const fs = require('fs');
  const https = require('https');
  const JSSoup = require('jssoup').default;
  const config = require('../config');
  const mediaFormats = [".jpg", ".png", ".gif", ".webm"];
  let targetDomain = config.availableDomains[0].host;
  let board = config.availableDomains[0].targetBoards[0];
  let pathSeperator = config.availableDomains[0].path_sep;
  let outputDir = config.outputDir;
  let targetBoards = config.targetBoards;
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
    return new Promise((res,rej)=>{
      let fileStream = fs.createWriteStream(absolutePath);
      https.get(uri,(resp)=>{
        resp.pipe(fileStream);
        fileStream.on('finish',()=>{
          fileStream.close(()=>{
            res();
          })
        });
      }).on('error',rej).end();
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
      return true;
    }
    return false;
  }
  function _buildPage(board,page){
    switch(targetDomain){
      case config.availableDomains[0].host:
        return _buildChanPage(board,page);
      case config.availableDomains[3].host:
        return _buildKunPage(board,page);
      default:
        throw new Error('Unable to buildPage for Host: ' + targetDomain);
    }
  }
  function _buildChanPage(board,page){
    if(pageNum === 0){
      return targetDomain + '/' + board + '/';
    }
    return targetDomain + '/' + board + '/page/' + page;
  }
  function _buildKunPage(board,page){
    if(pageNum === 0){
      return targetDomain + '/' + board + '/index.html';
    }
    return targetDomain + '/' + board + '/' + page + '.html';
  }
  function _parseThreads(html){
    let soup = new JSSoup(html);
    //switch config host to properly parse links.
    switch(targetDomain){
      case config.availableDomains[0].host:
        return soup.findAll('article').filter((thread)=>{return thread.attrs['data-thread-num'] !== undefined}).map((thread)=>{return thread.attrs['data-thread-num']});
      case config.availableDomains[3].host:
        return soup.findAll('div','thread').filter((thread)=>{return thread.attrs['id'] !== undefined}).map((thread)=>{return thread.attrs['id'].split('_')[1]});
      default:
        throw new Error('Unable to parse Threads for Host: ' + targetDomain);
    }
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
  async function _downloadFile(targetDir,uri){
    let fileName = targetDir + uri.split('/')[uri.split('/').length - 1].replace(/[^-_.A-Za-z0-9]/g,'');
    if(!fs.existsSync(fileName)){
      try{
        await _getToFile(fileName,uri);
      }catch(err){
        console.error('\x1b[31m','Error Downloading: ' + uri + "\n" + err.message);
      }
    }
  }
  function _saveHtml(targetDir,uri){
    let fileName = uri.split('/' + pathSeperator + '/')[1].includes('.html') ? uri.split('/' + pathSeperator + '/')[1]:uri.split('/' + pathSeperator + '/')[1] + '.html';
    _getToFile(fileName,uri);
  }
  async function _parseMedia(threadDir,html){
    let anchors = _parseAnchors(html);
    for(let i in anchors){
      await _downloadFile(threadDir,anchors[i]);
    }
  }
  async function _crawlPage(uri){
    let html = await _get(uri);
    let threads = _parseThreads(html).map((threadId)=>{return targetDomain + '/' + board + '/' + pathSeperator + '/' + threadId});
    if(threads.length){
      for(let i in threads){
        await _crawlThread(threads[i]);
      }
      // threads.forEach(await _crawlThread);
      return true;
    }
    return false;
  }
  async function _crawlThread(uri){
    let html = await _get(uri);
    let threadId = uri.split('/' + pathSeperator + '/')[1];
    let threadDir = _buildThreadPath(threadId);
    if(_prepDir(threadDir)){
      console.log('\x1b[32m','Crawling Thread: ' + threadId);
      try{
        await _saveHtml(threadDir,uri);
        await _parseMedia(threadDir,html);
      }catch(err){
        console.error(err);
        return false;
      }
    }else{
      console.error('\x1b[33m','Skipping duplicate thread: ' + threadId);
    }
    return true;
  }
  return {
    config:config,
    targetBoards:targetBoards,
    urlBase:targetDomain,
    board:board,
    test:function(uri){
      return _downloadFile('./data/',uri);
    },
    setHost:function(availableDomain){
      this.urlBase = availableDomain.host;
      pathSeperator = availableDomain.path_sep;
      targetDomain = this.urlBase;
      return this.urlBase;
    },
    setBoard:function(targetBoard){
      this.board = targetBoard;
      board = this.board;
      return this.board;
    },
    crawl:async function(targetBoard){
      this.setBoard(targetBoard);
      _prepDir(_buildBoardPath(targetBoard));
      let paginating = true;
      pageNum = 2
      while(paginating){
        console.log('\x1b[32m','Current page: ' + pageNum);
        let page = _buildPage(targetBoard,pageNum);
        if(!await _crawlPage(page)){
          console.log('\x1b[31m','No threads on page: ' + pageNum + '. Stopping.');
          paginating = false;
        }
        pageNum++;
      }
      return true;
      // _crawlThread('https://8kun.top/pnd/res/50808.html');
      // pages.forEach(_crawlPage);
    }
  }


}());

module.exports = mod;
//double htmls
