import React, { useEffect, useRef, useState } from 'react';
import { vertexShaderSource, rainFragmentShaderSource, snowFragmentShaderSource } from './AtmosphericShader';

interface AtmosphericCanvasProps {
  mode: 'rain' | 'snow';
  backgroundUrl: string;
  backgroundType: 'image' | 'video';
  rainAmount: number;
  fogAmount: number;
  refraction: number;
}

const AtmosphericCanvas: React.FC<AtmosphericCanvasProps> = ({
  mode,
  backgroundUrl,
  backgroundType,
  rainAmount,
  fogAmount,
  refraction,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const requestRef = useRef<number>(0);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const rainProgramRef = useRef<WebGLProgram | null>(null);
  const snowProgramRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, z: 0 });
  const [textureRes, setTextureRes] = useState({ w: 1, h: 1 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2', { alpha: false, premultipliedAlpha: false });
    if (!gl) {
      console.error('WebGL 2 not supported');
      return;
    }
    glRef.current = gl;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: window.innerHeight - e.clientY,
        z: e.buttons > 0 ? 1 : 0
      };
    };
    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current.z = 1;
    };
    const handleMouseUp = () => {
      mouseRef.current.z = 0;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Create program helper
    const createProgram = (gl: WebGL2RenderingContext, vsSource: string, fsSource: string) => {
      const createShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
      const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) return null;

      const program = gl.createProgram();
      if (!program) return null;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    };

    rainProgramRef.current = createProgram(gl, vertexShaderSource, rainFragmentShaderSource);
    snowProgramRef.current = createProgram(gl, vertexShaderSource, snowFragmentShaderSource);

    // Full screen quad
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Initial texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    textureRef.current = texture;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', resize);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Handle background changes
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    if (backgroundType === 'image') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = backgroundUrl;
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        setTextureRes({ w: img.width, h: img.height });
      };
    } else if (backgroundType === 'video') {
      const video = document.createElement('video');
      video.src = backgroundUrl;
      video.loop = true;
      video.muted = true;
      video.crossOrigin = 'anonymous';
      video.playsInline = true;
      video.play();
      video.onloadedmetadata = () => {
        setTextureRes({ w: video.videoWidth, h: video.videoHeight });
      };
      videoRef.current = video;
    }
  }, [backgroundUrl, backgroundType]);

  // Render loop
  useEffect(() => {
    const gl = glRef.current;
    const program = mode === 'rain' ? rainProgramRef.current : snowProgramRef.current;
    if (!gl || !program) return;

    const iResolution = gl.getUniformLocation(program, 'iResolution');
    const iTime = gl.getUniformLocation(program, 'iTime');
    const iMouse = gl.getUniformLocation(program, 'iMouse');
    const uTextureResolution = gl.getUniformLocation(program, 'uTextureResolution');
    const uRainAmount = gl.getUniformLocation(program, 'uRainAmount');
    const uFogAmount = gl.getUniformLocation(program, 'uFogAmount');
    const uRefraction = gl.getUniformLocation(program, 'uRefraction');
    const positionLoc = gl.getAttribLocation(program, 'position');

    const render = (time: number) => {
      gl.useProgram(program);

      // Setup attributes (needed for each program switch)
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      // Update video texture if needed
      if (backgroundType === 'video' && videoRef.current && videoRef.current.readyState >= videoRef.current.HAVE_CURRENT_DATA) {
        gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoRef.current);
        gl.generateMipmap(gl.TEXTURE_2D);
      }

      gl.uniform3f(iResolution, gl.canvas.width, gl.canvas.height, 1.0);
      gl.uniform1f(iTime, time * 0.001);
      gl.uniform3f(iMouse, mouseRef.current.x, mouseRef.current.y, mouseRef.current.z);
      gl.uniform2f(uTextureResolution, textureRes.w, textureRes.h);
      gl.uniform1f(uRainAmount, rainAmount);
      gl.uniform1f(uFogAmount, fogAmount);
      gl.uniform1f(uRefraction, refraction);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(requestRef.current);
  }, [rainAmount, fogAmount, refraction, backgroundType, mode, textureRes]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: -1 }}
    />
  );
};

export default AtmosphericCanvas;
