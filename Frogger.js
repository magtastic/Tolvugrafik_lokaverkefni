////////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//    Byggt á sýnisforriti í C fyrir OpenGL, höfundur óþekktur.
//
//     Bíll sem keyrir í hringi í umhverfi með húsum.  Hægt að
//    breyta sjónarhorni áhorfanda með því að slá á 1, 2, ..., 8.
//    Einnig hægt að breyta hæð áhorfanda með upp/niður örvum.
//
//    Hjálmtýr Hafsteinsson, mars 2016
////////////////////////////////////////////////////////////////////
var canvas;
var gl;

var BLUE = vec4(0.0, 0.0, 1.0, 1.0);
var RED = vec4(1.0, 0.0, 0.0, 1.0);
var GRAY = vec4(0.4, 0.4, 0.4, 1.0);

var riverBuffer;
var roadBuffer;
var frogBuffer;

var vPosition;
var colorLoc;
var mvLoc;
var pLoc;
var proj;

var frogVertices = [
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
    vec3( -5, 45,  0 ), vec3( -5,  45,  10 ), vec3( -5,  55, 10 )
];

var riverVertices = [
    vec3( 55, -15, 0.0 ), vec3( 55, -55, 0.0 ),
    vec3( -55, -15, 0.0 ), vec3( -55, -55, 0.0 )
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
    gl.bufferData( gl.ARRAY_BUFFER, flatten(frogVertices), gl.STATIC_DRAW );

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

    render();
}

function drawRoad(mv) {

    gl.uniform4fv( colorLoc, GRAY );
    gl.bindBuffer( gl.ARRAY_BUFFER, roadBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

}

function drawRiver(mv) {

    gl.uniform4fv( colorLoc, BLUE );
    gl.bindBuffer( gl.ARRAY_BUFFER, riverBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

}

function drawFrog(mv) {

    gl.uniform4fv( colorLoc, RED );
    gl.bindBuffer( gl.ARRAY_BUFFER, frogBuffer );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 36 );

}

function initMv() {

  var mv = mat4();
  mv = lookAt( vec3(0.0, 3.0, 2.0),
               vec3(0.0, 0.0, 0.0),
               vec3(0.0, 0.0, 1.0) );

  mv = mult( mv, scalem( 0.02 , 0.02 , 0.02 ) );

  return mv;

}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var mv = initMv();

    drawRoad(mv);
    drawRiver(mv);
    drawFrog(mv);

    requestAnimFrame( render );
}
