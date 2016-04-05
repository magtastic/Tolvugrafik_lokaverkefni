var canvas;
var gl;

var mv;

var BLUE = vec4(0.0, 0.0, 1.0, 1.0);
var RED = vec4(1.0, 0.0, 0.0, 1.0);
var GRAY = vec4(0.4, 0.4, 0.4, 1.0);
var YELLOW = vec4(1.0, 1.0, 0.0, 1.0);
var BROWN = vec4(0.8, 0.6, 0.4, 1.0);
var WHITE = vec4(1.0, 1.0, 1.0, 1.0);
var RANDOM = vec4(0.8, 0.7, 0.0, 1.0);

var LEFT_KEY = 37;
var UP_KEY = 38;
var RIGHT_KEY = 39;
var DOWN_KEY = 40;

var riverBuffer;
var roadBuffer;
var frogBuffer;

var vPosition;
var colorLoc;
var mvLoc;
var pLoc;
var proj;

var flyInfo = {
  generateFly: Math.random()*700,
  midOrEnd: Math.random(),
  isAlive: false,
  liveTime: 0,
  mv: mat4()
};

var logsInfo = [
  makeLogLaneInfo(0.5,-70,-50,4,-80,3,mat4()),
  makeLogLaneInfo(-0.6,-80,50,4,60,2,mat4()),
  makeLogLaneInfo(0.2,-90,-50,4,-60,2,mat4()),
  makeLogLaneInfo(-1.5,-100,50,4,60,3,mat4()),
  makeLogLaneInfo(0.1,-110,-50,4,-60,1,mat4())
];

var carsInfo = [
  makeCarLaneInfo(0.5,-10,-50,4,-40,mat4()),
  makeCarLaneInfo(-1,-20,50,2,60,mat4()),
  makeCarLaneInfo(0.2,-30,-50,6,-30,mat4()),
  makeCarLaneInfo(-0.4,-40,50,4,50,mat4()),
  makeCarLaneInfo(0.5,-50,-50,4,-40,mat4())
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
    lives: 10,
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

function makeCarLaneInfo(vel,yPos,xPos,numObj,dist,mv){
  var result = {
    vel: vel,
    yPos: yPos,
    xPos: xPos,
    numObj: numObj,
    dist: dist,
    mv: mv
  };
  return result;
}

function initMv() {
  mv = mat4();
  mv = lookAt( vec3((frogInfo.xPos*0.02), (frogInfo.yPos*0.02)+2, 1.0),
               vec3((frogInfo.xPos*0.02), frogInfo.yPos*0.02, 0.0),
               vec3(0.0, 0.0, 1.0) );

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

  lane.mv = mult( lane.mv, scalem(1,1,0.5));

  gl.uniformMatrix4fv(mvLoc, false, flatten(lane.mv));
  gl.drawArrays( gl.TRIANGLES, 0, 36 );

  lane.mv = mult( lane.mv, translate( 0.0,0.0,3 ) );
  lane.mv = mult( lane.mv, scalem( 0.8,1,1 ));

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

function makeLogLaneInfo(vel,yPos,xPos,numObj,dist,size,mv){
  var result = {
    vel: vel,
    yPos: yPos,
    xPos: xPos,
    numObj: numObj,
    dist: dist,
    size: size,
    mv: mv
  };
  return result;
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
    frogInfo.lives--;
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

function drawFly(){
  gl.uniform4fv( colorLoc, RANDOM );

  gl.bindBuffer( gl.ARRAY_BUFFER, frogBuffer );
  gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

  flyInfo.mv = mv;

  flyInfo.mv = mult( flyInfo.mv, translate( 0 , -60, 0 ) );
  if(flyInfo.midOrEnd < 0.5){
    flyInfo.mv = mult( flyInfo.mv, translate( 0 , -60, 0 ) );
    console.log('end');
  }

  flyInfo.mv = mult( flyInfo.mv, scalem(1,1,0.5));

  gl.uniformMatrix4fv(mvLoc, false, flatten(flyInfo.mv));
  gl.drawArrays( gl.TRIANGLES, 0, 36 );
}

function updateFly() {

  if(flyInfo.isAlive){

    flyInfo.liveTime--;

    if(flyInfo.liveTime < 0){
      flyInfo.isAlive = false;
      flyInfo.generateFly = Math.random()*700;
      flyInfo.midOrEnd = Math.random();
    }

    drawFly();

  }else{

    flyInfo.generateFly--;

    if(flyInfo.generateFly < 0){
      flyInfo.isAlive = true;
      flyInfo.liveTime = Math.random()*100;
    }

  }

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

    updateFly();

    requestAnimFrame( render );
}
