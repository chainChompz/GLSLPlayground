var main=function() {

	var CANVAS=document.getElementById("webgl_canvas");
	var SHADERSTATUS = document.getElementById("shaderstatus");
	var SHADERSTATUSTEXT = document.getElementById("shaderstatustext");
	var FULLSCREENBUTTON = document.getElementById("fullscreenbutton");
	var HIDECODEBUTTON = document.getElementById("hidecode");
	var CODEAREA = document.getElementById("codeAreaWrapper");

	FULLSCREENBUTTON.addEventListener( 'click', 
										function ( event ) {
											var elem = document.body;
											
											if (elem.requestFullscreen) {
											  elem.requestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
											} else if (elem.msRequestFullscreen) {
											  elem.msRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
											} else if (elem.mozRequestFullScreen) {
											  elem.mozRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
											} else if (elem.webkitRequestFullscreen) {
											  elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
											}

										}, 
										false );
										
	HIDECODEBUTTON.addEventListener( 'click', 
										function ( event ) {
											if (CODEAREA.style.display == 'block' || CODEAREA.style.display=='')
											{
												CODEAREA.style.display = 'none';
												HIDECODEBUTTON.value = 'Show Code';
											}
											else 
											{
												CODEAREA.style.display = 'block';
												HIDECODEBUTTON.value = 'Hide Code';
											}
										}, 
										false );
	
	CANVAS.width=window.innerWidth;
	CANVAS.height=window.innerHeight;

	var mousePosition=[0,0];
	document.addEventListener('mousemove', function(event) {
	mousePosition[0]=event.clientX,
	  mousePosition[1]=event.clientY;
	}, false);



	/*========================= GET WEBGL CONTEXT ========================= */
	var GL;
	try {
	GL = CANVAS.getContext("experimental-webgl", {antialias: false});
	} catch (e) {
	alert("You are not webgl compatible :(") ;
	return false;
	}

	/*========================= SHADERS ========================= */
	/*jshint multistr: true */


	var get_shader=function(source, type, typeString) {
	var shader = GL.createShader(type);
	GL.shaderSource(shader, source);
	GL.compileShader(shader);
	if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
	  alert("ERROR IN "+typeString+ " SHADER : " + GL.getShaderInfoLog(shader));
	  return false;
	}
	return shader;
	};

	var shader_vertex_textarea=document.getElementById('vertexSourceTextarea');
	var shader_fragment_textarea=document.getElementById('fragmentSourceTextarea');
	var _position, SHADER_PROGRAM;
	var _resolution;
	var _time;
	var _mouse;
	var _Pmatrix;
	var _Vmatrix;
	var _Mmatrix;
	var _color;

	var refresh_Shaders=function() {
		var shader_fragment = GL.createShader(GL.FRAGMENT_SHADER);
		var shader_vertex = GL.createShader(GL.VERTEX_SHADER);
		GL.shaderSource(shader_vertex, (CODEVIEW1)?CODEVIEW1.getValue():shader_vertex_textarea.value);
		GL.shaderSource(shader_fragment, (CODEVIEW2)?CODEVIEW2.getValue():shader_fragment_textarea.value);
		GL.compileShader(shader_fragment);
		GL.compileShader(shader_vertex);
		if (GL.getShaderParameter(shader_fragment, GL.COMPILE_STATUS) && GL.getShaderParameter(shader_vertex, GL.COMPILE_STATUS)) {
			SHADERSTATUSTEXT.innerHTML = "Shaders Compiled Succssefully";
			SHADERSTATUSTEXT.style.color = '#80FF00';
			SHADERSTATUS.style.borderColor = '#80FF00';
			SHADERSTATUS.style.backgroundColor = 'rgba(57, 0, 0, 0.3)';
			
			SHADER_PROGRAM=GL.createProgram();

			GL.attachShader(SHADER_PROGRAM, shader_vertex);
			GL.attachShader(SHADER_PROGRAM, shader_fragment);

			GL.linkProgram(SHADER_PROGRAM);

			_mouse = GL.getUniformLocation(SHADER_PROGRAM, "mouse");
			_time = GL.getUniformLocation(SHADER_PROGRAM, "time");
			_resolution = GL.getUniformLocation(SHADER_PROGRAM, "resolution");
			_position = GL.getAttribLocation(SHADER_PROGRAM, "position");
			_color = GL.getAttribLocation(SHADER_PROGRAM, "color");
			_Pmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Pmatrix");
			_Vmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Vmatrix");
			_Mmatrix = GL.getUniformLocation(SHADER_PROGRAM, "Mmatrix");

			GL.enableVertexAttribArray(_position);
			GL.enableVertexAttribArray(_color);
			GL.useProgram(SHADER_PROGRAM);
		}
		else if(!GL.getShaderParameter(shader_fragment, GL.COMPILE_STATUS))
		{
			
			SHADERSTATUSTEXT.innerHTML = "Cannot Compile Fragment Shader";
			SHADERSTATUSTEXT.style.color = '#FF0000';
			SHADERSTATUS.style.borderColor = '#FF0000';
		}
		else if(!GL.getShaderParameter(shader_vertex, GL.COMPILE_STATUS))
		{
			
			SHADERSTATUSTEXT.innerHTML = "Cannot Compile Vertex Shader";
			SHADERSTATUSTEXT.style.color = '#FF0000';
			SHADERSTATUS.style.borderColor = '#FF0000';
		}
	};

	refresh_Shaders();

	var CODEVIEW1 = CodeMirror.fromTextArea(shader_vertex_textarea,
										 {
										   lineNumbers: true,
										   matchBrackets: true,
										   indentWithTabs: true,
										   tabSize: 8,
										   indentUnit: 8
										   ,mode: "text/x-glsl"
										   ,onChange: refresh_Shaders
										 });
	for (var i=0; i<CODEVIEW1.lineCount(); i++) {
		CODEVIEW1.indentLine(i);
	};
	
	
	var CODEVIEW2 = CodeMirror.fromTextArea(shader_fragment_textarea,
										 {
										   lineNumbers: true,
										   matchBrackets: true,
										   indentWithTabs: true,
										   tabSize: 8,
										   indentUnit: 8
										   ,mode: "text/x-glsl"
										   ,onChange: refresh_Shaders
										 });
	for (var i=0; i<CODEVIEW2.lineCount(); i++) {
		CODEVIEW2.indentLine(i);
	};







	/*========================= THE TRIANGLE ========================= */
	//POINTS :
	var triangle_vertex=[
	-1,-1, //first summit -> bottom left of the viewport
	1,-1, //bottom right of the viewport
	1,1  //top right of the viewport
	,-1,1
	];

	var TRIANGLE_VERTEX= GL.createBuffer ();
	GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
	GL.bufferData(GL.ARRAY_BUFFER,
				new Float32Array(triangle_vertex),
	GL.STATIC_DRAW);

	//FACES :
	var triangle_faces = [0,1,2, 0,2,3];

	var TRIANGLE_FACES= GL.createBuffer ();
	GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, TRIANGLE_FACES);
	GL.bufferData(GL.ELEMENT_ARRAY_BUFFER,
				new Uint16Array(triangle_faces),
	GL.STATIC_DRAW);



	

	/*========================= DRAWING ========================= */

	GL.clearColor(0.0, 0.0, 0.0, 0.0);



	var animate=function(timestamp) {
		CANVAS.width=window.innerWidth;
		CANVAS.height=window.innerHeight;
		GL.viewport(0.0, 0.0, CANVAS.width, CANVAS.height);
		GL.clear(GL.COLOR_BUFFER_BIT);

		GL.uniform2fv(_mouse, mousePosition);
		GL.uniform1f(_time, timestamp*0.001);
		GL.uniform2f(_resolution, CANVAS.width, CANVAS.height);
		GL.bindBuffer(GL.ARRAY_BUFFER, TRIANGLE_VERTEX);
		GL.vertexAttribPointer(_position, 2, GL.FLOAT, false,4*2,0) ;

		GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, TRIANGLE_FACES);
		GL.drawElements(GL.TRIANGLES, 6, GL.UNSIGNED_SHORT, 0);
		GL.flush();

		window.requestAnimationFrame(animate);
	};


	animate(0);
};