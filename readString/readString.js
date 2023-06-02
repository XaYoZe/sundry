const fs = require('fs')
let content = fs.readFileSync('./index.ts', { encoding: 'utf-8' })

let index = 0
let keyword = []

let isBlock = false
let blockDeepCount = 0
let blockStr = ''
function readBlock(chart) {
  if (chart === '{') {
    if (isBlock) {
      blockDeepCount++
      // console.log(blockDeepCount);
    } else {
      isBlock = true
    }
  }
  if (isBlock) {
    blockStr += chart
    // console.log(chart)
  } else {
    if (blockStr) {
      // console.log(blockStr);
    }
    blockStr = ''
  }
  if (chart === '}') {
    if (blockDeepCount > 0) {
      blockDeepCount--
    } else {
      isBlock = false
    }
  }
}
/*
 */
let commentType = 0
let commentStart = false
let commentCheckIndex = 0
let commentText = ''
function comment(chart) {
  if (commentStart) {
    commentText += chart
    if (commentType === 1 && chart === '\n') {
      console.log(commentText)
      commentStart = false
      commentType = 0
      commentText = ''
    } else if (commentType === 2) {
      if (commentCheckIndex === 0 && chart === '*') {
        commentCheckIndex++
      } else if (commentCheckIndex === 1) {
        switch (chart) {
          case '/':
            console.log(commentText)
            commentStart = false
            commentType = 0
            commentCheckIndex = 0
            commentText = ''
            break
          case '*':
            commentCheckIndex = 1
            break
          default:
            commentCheckIndex = 0
            break
        }
      }
    }
    return
  }
  if (commentCheckIndex === 0 && chart === '/') {
    commentCheckIndex++
  } else if (commentCheckIndex === 1) {
    switch (chart) {
      case '/':
        commentStart = true
        commentType = 1
        commentText = '//'
        break
      case '*':
        commentText = '/*'
        commentStart = true
        commentType = 2
        break
      default:
        break
    }
    commentCheckIndex = 0
  }
}

let keyIndex = 0
let importWord = 'import'
function checkImportKeyWord(chart) {}

let isBreak = false
let lineText = ''
function readBreakLine(chart) {
  if (chart === '\n') {
    // console.log(lineText);
    // console.log('----------');
    lineText = ''
    isBreak = true
  } else {
    lineText += chart
    isBreak = false
  }
}

let chart = ''
while (chart = content[index++]) {
  // console.log(chart)
  comment(chart)
  // readBlock(chart);
  // readBreakLine(chart);
}
