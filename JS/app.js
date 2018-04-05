// -----------------------------------------------------------------------------------------------------------
// --------------------------------------------------- Web3 inits --------------------------------------------
// -----------------------------------------------------------------------------------------------------------

// called from angularApp.js

function initWeb3() {
  if (typeof web3 !== 'undefined' && typeof web3.currentProvider !== 'undefined') {
    web3Provider = web3.currentProvider;
    web3 = new Web3(web3Provider);
  } else {    
    console.error('No web3 provider found. Please install Metamask on your browser.');
    alert('No web3 provider found. Please install Metamask on your browser.');
  }
  initOneMillionPixelsContract();
}

var scope;

function initOneMillionPixelsContract () {
  // the file OneMillionPixels.json contains the ABI of the smart contract, and the address 
  // of the deployed instance of it 
  $.getJSON('OneMillionPixels.json', function(data) {
    // Get the necessary contract artifact file and instantiate it with truffle-contract
    OMPContract = TruffleContract(data);

    // Set the provider for our contract
    OMPContract.setProvider(web3Provider);

    scope = angular.element(document.getElementById('MainControllerTag')).scope();
    scope.getEvents();
  });

  watchForWhenAnAccountIsUnlocked ();
}

// -----------------------------------------------------------------------------------------------------------
// -------------------------------------------------- Main Canvas --------------------------------------------
// -----------------------------------------------------------------------------------------------------------

var canvas = document.getElementById('pixelsCanvas');
context = canvas.getContext('2d');

function initCanvas () {
  var preDraw = performance.now();
  for (var i = 0; i < 1000; i++) {
    for (var j = 0; j < 1000; j++) {
      if(i % 10 != 0)
        context.fillStyle = '#FFFFFF';
      else 
        context.fillStyle = '#E7E7E7';

      if(j % 10 == 0) 
        context.fillStyle = '#E7E7E7';

      context.fillRect(j, i, 1, 1);
    }
  }

  var postDraw = performance.now();
  console.log("Initializing the canvas took " + (postDraw - preDraw) + " milliseconds.")

  $( "#removeAfterLoad" ).remove();
}

function pick(event) {
  var rect = canvas.getBoundingClientRect(); // to calculate approximatif position

  var x = event.pageX - rect.left - scrollX; 
  var y = event.pageY- rect.top - scrollY;

  if(scope != null && scope != 'undefined') {
    scope.showInfosPopUp();
  }

  if(x > 500) {
    $( '#pixelInfos' ).css( "right", "auto" );
    $( '#pixelInfos' ).css( "left", "0" );
    $( '#pixelInfos' ).css( "margin-left", "1em" );
    $( '#pixelInfos' ).css( "margin-right", "0" );
  } else {
    $( '#pixelInfos' ).css( "right", "0" );
    $( '#pixelInfos' ).css( "left", "auto" );
    $( '#pixelInfos' ).css( "margin-left", "0" );
    $( '#pixelInfos' ).css( "margin-right", "1em" );
  }

  pixelToTokenPositionInCanvas(x, y);
}

// On mouse quits canvas
function quitCanvas () {
  if(scope != null && scope != 'undefined') {
    scope.hideInfosPopUp();
  }
}

function showInfosModal () {
  if(scope) {
    scope.updateCHOTID_clicked();
    $('#tokenInfosModal').modal();
    fillBigPixelsCanvas ();
  }
}

canvas.addEventListener('mousemove', pick);
canvas.addEventListener("mouseout", quitCanvas); 
canvas.addEventListener("click", showInfosModal);

window.onload = initCanvas ();

// -----------------------------------------------------------------------------------------------------------
// ----------------------------------------------- Big Pixels Canvas -----------------------------------------
// -----------------------------------------------------------------------------------------------------------

var bigPixelsCanvas = document.getElementById('bigPixelsCanvas');
contextBPC = bigPixelsCanvas.getContext('2d');

function initBigPixelsCanvas () {

  var preDraw = performance.now();
  for (var i = 0; i < 300; i++) {
    for (var j = 0; j < 300; j++) {
      if(i % 30 != 0)
        contextBPC.fillStyle = '#FFFFFF';
      else 
        contextBPC.fillStyle = '#E7E7E7';
// paint the inside too
      if(j % 30 == 0) 
        contextBPC.fillStyle = '#E7E7E7';

      contextBPC.fillRect(j, i, 1, 1);
    }
  }

  var postDraw = performance.now();
  console.log("Initializing the big pixels canvas took " + (postDraw - preDraw) + " milliseconds.")

}

window.onload = initBigPixelsCanvas ();



function pickBigOneTokenCanvas(event) {
  var rect = bigPixelsCanvas.getBoundingClientRect(); // to calculate approximatif position

  var x = event.pageX - rect.left - scrollX; 
  var y = event.pageY- rect.top - scrollY;

  //console.log("x : " + x + ", y :" + y)

  pixelPositionInBigPixelCanvasToSquareTopLeft(x, y)

  if(mouseDown){
    paintOnHold (event);
  }
}

function paintOnHold (event) {
  var rect = bigPixelsCanvas.getBoundingClientRect(); // to calculate approximatif position

  var x = event.pageX - rect.left - scrollX; 
  var y = event.pageY- rect.top - scrollY;

  var value = $("#flat").spectrum('get').toHexString();

  if(scope.tokenInfos[scope.cHOTID_clicked].colorsArray[scope.cHOSquare] != value)
  changeSquareColors(scope.cHOSquare, value);

  scope.tokenInfos[scope.cHOTID_clicked].colorsArray[scope.cHOSquare] = value;
}

bigPixelsCanvas.addEventListener('mousemove', pickBigOneTokenCanvas);
bigPixelsCanvas.addEventListener('mousedown', paintOnHold);


// -----------------------------------------------------------------------------------------------------------
// -------------------------------------------------- Color picker -------------------------------------------
// ----------------------------------------------------------------------------------------------------------- 

$("#flat").spectrum({
    flat: true,
    preferredFormat: "hex",
    showInput: true,
    showAlpha: false,
    showPalette: true,
    showSelectionPalette: true,
    showButtons: false
});

// -----------------------------------------------------------------------------------------------------------
// ------------------------------------------------ Helper functions -----------------------------------------
// ----------------------------------------------------------------------------------------------------------- 


// ---- Main  Canvas

function pixelToTokenPositionInCanvas (x , y) {
  var left = x - (x % 10);
  var top = y - (y % 10);

  canvasToToken (left, top)
}

function canvasToToken (left, top) {
  var posX = left / 10;
  var posY = top * 10;

  var tokenId = posX + posY;

  if(scope)
  scope.updateCHOTID(tokenId);
}

function tokenToCanvasPos (tokenId) {
  var pos = {}
  pos.x = tokenId % 100;
  pos.y = (tokenId - pos.x) / 100;

  pos.x *= 10;
  pos.y *= 10;
  return pos;
}

// fills the main canvas when the event for pixels is received
function paintCanvasSquareFromEvents(parcelId, arrayOfColors) {
  var index = 0;

  var anchor = tokenToCanvasPos(parcelId);
  //console.log(anchor)
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      context.fillStyle = arrayOfColors[index];

      context.fillRect(j + anchor.x, i + anchor.y, 1, 1);
      index++;
    }
  }
}

// --- Big pixels canvas

function pixelPositionInBigPixelCanvasToSquareTopLeft (x , y) {
  var left = x - (x % 30);
  var top = y - (y % 30);

  //console.log('Left: ' + left + ', top: ' + top)
  bigPixelCanvasToSquare(left, top)
}

function bigPixelCanvasToSquare (left, top) {
  var posX = left / 30;
  var posY = (top / 30) * 10;

  var square = posX + posY;
  //console.log(square)
  if(scope) {
    scope.updateCHOSquare(square);
  }
  
}

function squareToBigPixelsCanvasParcel (square) {
  var pos = {x: 0,
    y: 0
  }

  pos.x = (square % 10) * 30;

  pos.y = ((square - (square % 10))) * 3;

  //console.log('x: ' + pos.x + ' - y: ' + pos.y)
  return pos;
}

function fillBigPixelsCanvas () {
  if(scope.tokenInfos[scope.cHOTID_clicked] != null) {
    for (var i = 0; i < scope.tokenInfos[scope.cHOTID_clicked].colorsArray.length; i++) {
      //console.log(scope.tokenInfos[scope.cHOTID_clicked].colorsArray[i])
      changeSquareColors(i, scope.tokenInfos[scope.cHOTID_clicked].colorsArray[i]);
    }
  }  
}

function changeSquareColors (square, color) {
  contextBPC.fillStyle = color;
  var pos = squareToBigPixelsCanvasParcel(square);
  contextBPC.fillRect(pos.x, pos.y, 30, 30);
}

function arrayOfColorsToString (theArray) {
  var stringOfArray = "";

  for (var i = 0; i < 100; i++) {
    if(theArray[i] != null)
      stringOfArray += theArray[i].substr(theArray[i].length - 6);
    else
      stringOfArray += "FFFFFF"
  }

  return stringOfArray;
}

function stringToArrayOfStrings (theString) {
  var arrayOfString = [];

  for (var i = 0; i < 100; i++) {
    arrayOfString[i] = "#" + theString.slice(i * 6, (i * 6)+6); 
  }

  return arrayOfString;
}

// --- 

// Doesn't seem to be any event coming from Metamask when an account is unlocked for now
// https://github.com/MetaMask/faq/blob/master/DEVELOPERS.md#ear-listening-for-selected-account-changes
function watchForWhenAnAccountIsUnlocked () {

  web3.eth.getAccounts(function(error, accounts) {
    if (error) {
      console.log(error);
      if(scope != null && scope != 'undefined') {
          if(scope.currentAccount != "")
          scope.setCurrentUnlockedAccount ("");
      }
    } else {
      if(accounts.length <= 0) {
        if(scope != null && scope != 'undefined') {
          if(scope.currentAccount != "")
          scope.setCurrentUnlockedAccount ("");
        }
      } else {

        if(scope != null && scope != 'undefined') {
          if(scope.currentAccount != accounts[0])
          scope.setCurrentUnlockedAccount (accounts[0]);
        }
      }
    }
  });

  setTimeout(watchForWhenAnAccountIsUnlocked, 3000);  
}

// --- Mouse down helper
var mouseDown = false;
document.body.onmousedown = function() { 
  mouseDown = true;
}
document.body.onmouseup = function() {
  mouseDown = false;
}

// --- Scroll to top helper

function scrollToTop () {
  $("html, body").animate({ scrollTop: 0 }, "slow");
  return false;
}