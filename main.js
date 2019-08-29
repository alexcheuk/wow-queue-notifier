const matchPixel = {
  '1920x1080': {
    queue: {
      x: 863,
      y: 582,
      hex: '710704'
    },
    character: {
      
    }
  }
}

async function startCapture() {
  logElem.innerHTML = "";

  try {
    videoElem.srcObject = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
    dumpOptionsInfo();
  } catch(err) {
    console.error("Error: " + err);
  }
}

function drawCanvas(canvas, img) {
  canvas.width = img.width;
  canvas.height = img.height;
  let ratio  = Math.min(canvas.width / img.width, canvas.height / img.height);
  let x = (canvas.width - img.width * ratio) / 2;
  let y = (canvas.height - img.height * ratio) / 2;
  canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  canvas.getContext('2d').drawImage(img, 0, 0, img.width, img.height,
      x, y, img.width * ratio, img.height * ratio);
}

function findPos(obj) {
  var curleft = 0, curtop = 0;
  if (obj.offsetParent) {
      do {
          curleft += obj.offsetLeft;
          curtop += obj.offsetTop;
      } while (obj = obj.offsetParent);
      return { x: curleft, y: curtop };
  }
  return undefined;
}

function rgbToHex(r, g, b) {
  if (r > 255 || g > 255 || b > 255)
      throw "Invalid color component";
  return ((r << 16) | (g << 8) | b).toString(16);
}

function getHexAtPixel (canvas, x, y) {
  const context = canvas.getContext('2d')
  const data = context.getImageData(x, y, 1, 1).data

  return rgbToHex(data[0], data[1], data[2])
}



$(() => {
  let step = 1
  let mediaStream
  let imageCapture
  let pixel2Match
  let interval

  const $startButton = $('#start')
  const $startWatchButton = $('.start-watch')
  const $frameButton = $('#frame')

  function drawFrameToCanvas (canvas) {
    return imageCapture.grabFrame()
        .then(imageBitmap => {
          drawCanvas(canvas, imageBitmap)
        })
        .catch(err => {
          console.log(err.message)
        })
  }

  let checks = 0
  function verifyNotInQueue () {
    if (checks < 2) {
      checks++
      return
    }

    clearInterval(interval)
    new Audio('notification.mp3').play()

    $('.start-watch').text('YOU ARE IN!')
    .css('background-color', 'green')
  }
  
  function checkQueueStatus(canvas) {
    drawFrameToCanvas(canvas)
      .then(() => {
        if (isInQueue(canvas)) {
          $('.start-watch').text('Waiting in Queue...')
        } else {
          verifyNotInQueue()
        }
      })
  }

  function isInQueue(canvas) {
    const px = getHexAtPixel(canvas, matchPixel['1920x1080'].queue.x, matchPixel['1920x1080'].queue.y)

    console.log(px, pixel2Match)
  
    return px === pixel2Match
  }

  $startButton.on('click', async () => {
    const displayMediaOptions = {
      video: {
        cursor: "never"
      },
      audio: false
    }

    mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions)
    $('#video')[0].srcObject = mediaStream

    
    const track = mediaStream.getVideoTracks()[0]

    imageCapture = new ImageCapture(track)

    $('.step1').hide()
    $('.step2').show()
  })

  $startWatchButton.on('click', () => {
    const canvas = $('#canvas')[0]

    if (interval) {
      clearInterval(interval)
    }

    drawFrameToCanvas(canvas)
      .then(() => {        
        pixel2Match = getHexAtPixel(canvas, matchPixel['1920x1080'].queue.x, matchPixel['1920x1080'].queue.y)
    
        interval = setInterval(() => {
          checkQueueStatus(canvas)
        }, 500)
      })

  })
})