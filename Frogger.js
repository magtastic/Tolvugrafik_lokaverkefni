var canvas;
var gl;

var mv;

var BLUE = vec4(0.0, 0.0, 1.0, 1.0);
var RED = vec4(1.0, 0.0, 0.0, 1.0);
var GRAY = vec4(0.4, 0.4, 0.4, 1.0);
var YELLOW = vec4(1.0, 1.0, 0.0, 1.0);
var BROWN = vec4(0.8, 0.6, 0.4, 1.0);

var LEFT_KEY = 37;
var UP_KEY = 38;
var RIGHT_KEY = 39;
var DOWN_KEY = 40;

var movement = false;
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var riverBuffer;
var roadBuffer;
var frogBuffer;

var vPosition;
var colorLoc;
var mvLoc;
var pLoc;
var proj;

var logsInfo = [
  {
    vel: 0.5,
    yPos: -70,
    xPos: -50,
    numObj: 4,
    dist: -80,
    size: 3,
    mv: mat4()
  },
  {
    vel: -0.6,
    yPos: -80,
    xPos: 50,
    numObj: 4,
    dist: 60,
    size: 2,
    mv: mat4()
  },
  {
    vel: 0.2,
    yPos: -90,
    xPos: -50,
    numObj: 4,
    dist: -60,
    size: 2,
    mv: mat4()
  },
  {
    vel: -1.5,
    yPos: -100,
    xPos: 50,
    numObj: 4,
    dist: 60,
    size: 3,
    mv: mat4()
  },
  {
    vel: 0.1,
    yPos: -110,
    xPos: -50,
    numObj: 4,
    dist: -60,
    size: 1,
    mv: mat4()
  }
];

var carsInfo = [
  {
    vel: 0.5,
    yPos: -10,
    xPos: -50,
    numObj: 4,
    dist: -40,
    mv: mat4()
  },
  {
    vel: -1,
    yPos: -20,
    xPos: 50,
    numObj: 2,
    dist: 60,
    mv: mat4()
  },
  {
    vel: 0.2,
    yPos: -30,
    xPos: -50,
    numObj: 6,
    dist: -30,
    mv: mat4()
  },
  {
    vel: -0.4,
    yPos: -40,
    xPos: 50,
    numObj: 4,
    dist: 50,
    mv: mat4()
  },
  {
    vel: 0.5,
    yPos: -50,
    xPos: -50,
    numObj: 4,
    dist: -40,
    mv: mat4()
  }
];


var frogInfo = {
  vertices:[
      // front side:
      vec3( -5,  45,  10 ), vec3( -5, 45,  0 ), vec3(  5, 45,  0 ),
      vec3(  5, 45,  0 ), vec3(  5,  45,  10 ), vec3( -5,  45,  10 ),
      // right side:
      vec3(  5,  45, 10 ), vec3(  5, 45,  0 ), vec3(  5, 55, 0 ),
      vec3(  5, 55, 10 ), vec3(  5,  55, 10 ), vec3(  5,  45,  10 ),
      // bottom side:
      vec3(  5, 45,  0 ), vec3( -5, 45,  0 ), vec3( -5, 55, 0 ),
      vec3( -5, 55, 0 ), vec3(  5, 55, 0 ), vec3(  5, 45,  0 ),
      // top side:
      vec3(  5,  55, 10 ), vec3( -5,  55, 10 ), vec3( -5,  45,  10 ),
      vec3( -5,  45,  10 ), vec3(  5,  45,  10 ), vec3(  5,  55, 10 ),
      // back side:
      vec3( -5, 55, 0 ), vec3( -5,  55, 10 ), vec3(  5,  55, 10 ),
      vec3(  5,  55, 10 ), vec3(  5, 55, 0 ), vec3( -5, 55, 0 ),
      // left side:
      vec3( -5,  55, 10 ), vec3( -5, 55, 0 ), vec3( -5, 45,  0 ),
      vec3( -5, 45,  0 ), vec3( -5,  45,  10 ), vec3( -5,  55, 10 ) ],

    xPos: 0,
    yPos: 0,
    vel: 0,
    mv: mat4()
};

var riverVertices = [
    vec3( 55, -15, 0.0 ), vec3( 55, -65, 0.0 ),
    vec3( -55, -15, 0.0 ), vec3( -55, -65, 0.0 )
];

var roadVertices = [
    vec3( 55, 45, 0.0 ), vec3( 55, -5, 0.0 ),
    vec3( -55, 45, 0.0 ), vec3( -55, -5, 0.0 )
];

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.7, 1.0, 0.7, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    riverBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, riverBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(riverVertices), gl.STATIC_DRAW );

    frogBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, frogBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(frogInfo.vertices), gl.STATIC_DRAW );

    roadBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, roadBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(roadVertices), gl.STATIC_DRAW );

    vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    colorLoc = gl.getUniformLocation( program, "fColor" );

    mvLoc = gl.getUniformLocation( program, "modelview" );

    // set projection
    pLoc = gl.getUniformLocation( program, "projection" );
    proj = perspective( 50.0, 1.0, 1.0, 500.0 );
    gl.uniformMatrix4fv(pLoc, false, flatten(proj));

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.offsetX - origX) ) % 360;
            spinX = ( spinX + (e.offsetY - origY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );

    window.addEventListener("keydown", function(e){
      if(e.keyCode === LEFT_KEY){
        frogInfo.xPos += 10;
      }
      else if(e.keyCode === RIGHT_KEY){
        frogInfo.xPos -= 10;
      }
      else if(e.keyCode === UP_KEY){
        frogInfo.yPos -= 10;
      }
      else if(e.keyCode === DOWN_KEY){
        frogInfo.yPos += 10;
      }
    });

    render();
}

function drawRoad() {

    gl.uniform4fv( colorLoc, GRAY );
    gl.bindBuffer( gl.ARRAY_BUFFER, roadBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

}

function drawRiver() {

    gl.uniform4fv( colorLoc, BLUE );
    gl.bindBuffer( gl.ARRAY_BUFFER, riverBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

}

function drawFrog() {

    initMv1();

    gl.uniform4fv( colorLoc, RED );
    gl.bindBuffer( gl.ARRAY_BUFFER, frogBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    gl.uniformMatrix4fv(mvLoc, false, flatten(frogInfo.mv));
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 36 );

}

function initMv1() {
  frogInfo.mv = mv;
  frogInfo.mv = mult( frogInfo.mv,
                      translate( frogInfo.xPos, frogInfo.yPos, 0.0 ) );
  frogInfo.mv = mult( frogInfo.mv, scalem( 0.9, 0.9, 0.9 ) );
  frogInfo.mv = mult( frogInfo.mv, translate( 0.0, 6.0, 0.0 ) );

}

function initMv() {
  mv = mat4();
  mv = lookAt( vec3((frogInfo.xPos*0.02), (frogInfo.yPos*0.02)+2, 1.0),
               vec3((frogInfo.xPos*0.02), frogInfo.yPos*0.02, 0.0),
               vec3(0.0, 0.0, 1.0) );

  mv = mult( mv, rotateX(spinX) );
  mv = mult( mv, rotateY(spinY) ) ;

  mv = mult( mv, scalem( 0.02 , 0.02 , 0.02 ) );
}

function drawCarLane( lane ) {

    // set color to blue
    gl.uniform4fv( colorLoc, YELLOW );

    gl.bindBuffer( gl.ARRAY_BUFFER, frogBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    for(var i = 0; i < lane.numObj; i++){
      lane.mv = mult( mv, translate( lane.xPos , lane.yPos, 0.1 ) );
      drawCar( lane, i );
      lane.mv = mult( mv, translate( -lane.xPos , -(lane.yPos), -(0.1) ) );
    }
}

function drawCar( lane, i ){

  lane.mv = mult( lane.mv, translate( lane.dist * i , 0, 0 ) );

  gl.uniformMatrix4fv(mvLoc, false, flatten(lane.mv));
  gl.drawArrays( gl.TRIANGLES, 0, 36 );

}

function drawLogLane( lane ) {

    // set color to blue
    gl.uniform4fv( colorLoc, BROWN );

    gl.bindBuffer( gl.ARRAY_BUFFER, frogBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    for(var i = 0; i < lane.numObj; i++){
      lane.mv = mult( mv, translate( lane.xPos , lane.yPos, 0.1 ) );
      drawLog( lane, i );
      lane.mv = mult( mv, translate( -lane.xPos , -(lane.yPos), -(0.1) ) );
    }
}

function drawLog( lane, i ){

  lane.mv = mult( lane.mv, translate( lane.dist * i , 0, 0 ) );

  lane.mv = mult( lane.mv, scalem( 1 , 1, 0.2 ) );

  for(var i = 0; i < lane.size; i++){
    gl.uniformMatrix4fv(mvLoc, false, flatten(lane.mv));
    gl.drawArrays( gl.TRIANGLES, 0, 36 );
    lane.mv = mult( lane.mv, translate( -10 , 0, 0 ) );
  }

}

function updateLogLane(lane){

  lane.xPos += lane.vel;

  if(lane.vel < 0){
    if(lane.xPos < -250){
      lane.xPos = 100;
    }
  }else{
    if(lane.xPos > 250){
      lane.xPos = -100;
    }
  }
}

function updateCarLane(lane){

  lane.xPos += lane.vel;

  if(lane.vel < 0){
    if(lane.xPos < -250){
      lane.xPos = 100;
    }
  }else{
    if(lane.xPos > 250){
      lane.xPos = -100;
    }
  }
}

function collisionDetection(){

  var car = false;

  if(frogInfo.yPos > -60){
      var currLane = carsInfo[(-frogInfo.yPos/10)-1];
      car = true;
  }else if(frogInfo.yPos < -60){
      var numLog = (-frogInfo.yPos/10)-7;
      var currLane = logsInfo[(-frogInfo.yPos/10)-7];
      console.log(numLog);
      car = false;
  }
  if(currLane === undefined){
    return;
  }

  var drasl = currLane.numObj;

  for( var i = 0; i < currLane.numObj; i++ ){
    if(car){
      if(frogInfo.xPos-10 < currLane.xPos - (i*-currLane.dist)
      && frogInfo.xPos-10 > currLane.xPos - (10+ (i*-currLane.dist))
      || frogInfo.xPos < currLane.xPos - (i*-currLane.dist)
      && frogInfo.xPos > currLane.xPos - (10 + (i*-currLane.dist))){
        collisionHandle(car);
      }
    }
    if(!car){
      if(frogInfo.xPos-10 < currLane.xPos - (i*-currLane.dist)
      && frogInfo.xPos-10 > currLane.xPos - (currLane.size*10 +
                                            (i*-currLane.dist))
      || frogInfo.xPos < currLane.xPos - (i*-currLane.dist)
      && frogInfo.xPos > currLane.xPos - (currLane.size*10 +
                                         (i*-currLane.dist))){
        console.log("J'aaa'a'ass");
        collisionHandle(false, numLog);
        drasl--;
        break;
      }
    }
  }
  if(drasl === currLane.numObj && !car){
    collisionHandle(true);
  }

}

function collisionHandle(car, i){
  if(car){
    frogInfo.vel = 0;
    frogInfo.xPos = 0;
    frogInfo.yPos = 0;
  }else{
    console.log("ssaa");
    frogInfo.vel = logsInfo[i].vel;
  }
}

function updateFrog(){
  if(frogInfo.yPos < -110 || frogInfo.yPos >= -60 ||
     frogInfo.xPos< -55 || frogInfo.xPos > 55) {
    frogInfo.vel = 0;
  }
    frogInfo.xPos += frogInfo.vel;
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    initMv();

    drawRoad();
    drawRiver();
    drawFrog();

    for(var i = 0; i < 5; i++){
      drawCarLane(carsInfo[i]);
      drawLogLane(logsInfo[i]);
      updateCarLane(carsInfo[i]);
      updateCarLane(logsInfo[i]);
    }
    collisionDetection();

    updateFrog();

    requestAnimFrame( render );
}
