/**
 * Atmospheric Shaders
 * Rain: Heartfelt by Martijn Steinrucken
 * Snow: Just Snow by Andrew Baldwin
 */

export const vertexShaderSource = `#version 300 es
  in vec2 position;
  out vec2 vUv;
  void main() {
    vUv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const commonUniforms = `
  uniform vec3 iResolution;
  uniform float iTime;
  uniform sampler2D iChannel0;
  uniform vec3 iMouse;
  uniform vec2 uTextureResolution;
  uniform float uRainAmount;
  uniform float uFogAmount;
  uniform float uRefraction;
  
  in vec2 vUv;
  out vec4 fragColor;

  vec2 getCenterCropUv() {
    float screenAspect = iResolution.x / iResolution.y;
    float texAspect = uTextureResolution.x / uTextureResolution.y;
    vec2 scale = vec2(1.0);
    if (screenAspect > texAspect) {
        scale.y = texAspect / screenAspect;
    } else {
        scale.x = screenAspect / texAspect;
    }
    return (vUv - 0.5) / scale + 0.5;
  }
`;

export const rainFragmentShaderSource = `#version 300 es
  precision highp float;
  ${commonUniforms}

  #define S(a, b, t) smoothstep(a, b, t)
  //#define CHEAP_NORMALS

  vec3 N13(float p) {
     vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));
     p3 += dot(p3, p3.yzx + 19.19);
     return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
  }

  float N(float t) {
      return fract(sin(t*12345.564)*7658.76);
  }

  float Saw(float b, float t) {
    return S(0., b, t)*S(1., b, t);
  }

  vec2 DropLayer2(vec2 uv, float t) {
      vec2 UV = uv;
      uv.y += t*0.75;
      vec2 a = vec2(6., 1.);
      vec2 grid = a*2.;
      vec2 id = floor(uv*grid);
      float colShift = N(id.x); 
      uv.y += colShift;
      id = floor(uv*grid);
      vec3 n = N13(id.x*35.2+id.y*2376.1);
      vec2 st = fract(uv*grid)-vec2(.5, 0);
      float x = n.x-.5;
      float y = UV.y*20.;
      float wiggle = sin(y+sin(y));
      x += wiggle*(.5-abs(x))*(n.z-.5);
      x *= .7;
      float ti = fract(t+n.z);
      y = (Saw(.85, ti)-.5)*.9+.5;
      vec2 p = vec2(x, y);
      float d = length((st-p)*a.yx);
      float mainDrop = S(.4, .0, d);
      float r = sqrt(S(1., y, st.y));
      float cd = abs(st.x-x);
      float trail = S(.23*r, .15*r*r, cd);
      float trailFront = S(-.02, .02, st.y-y);
      trail *= trailFront*r*r;
      y = UV.y;
      float trail2 = S(.2*r, .0, cd);
      float droplets = max(0., (sin(y*(1.-y)*120.)-st.y))*trail2*trailFront*n.z;
      y = fract(y*10.)+(st.y-.5);
      float dd = length(st-vec2(x, y));
      droplets = S(.3, 0., dd);
      float m = mainDrop+droplets*r*trailFront;
      return vec2(m, trail);
  }

  float StaticDrops(vec2 uv, float t) {
    uv *= 40.;
    vec2 id = floor(uv);
    uv = fract(uv)-.5;
    vec3 n = N13(id.x*107.45+id.y*3543.654);
    vec2 p = (n.xy-.5)*.7;
    float d = length(uv-p);
    float fade = Saw(.025, fract(t+n.z));
    float c = S(.3, 0., d)*fract(n.z*10.)*fade;
    return c;
  }

  vec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {
      float s = StaticDrops(uv, t)*l0; 
      vec2 m1 = DropLayer2(uv, t)*l1;
      vec2 m2 = DropLayer2(uv*1.85, t)*l2;
      float c = s+m1.x+m2.x;
      c = S(.3, 1., c);
      return vec2(c, max(m1.y*l0, m2.y*l1));
  }

  void main() {
    vec2 croppedUv = getCenterCropUv();
    vec2 fragCoord = vUv * iResolution.xy;
    vec2 uv = (fragCoord.xy-.5*iResolution.xy) / iResolution.y;
    
    float T = iTime;
    float t = T*.2;
    float rainAmount = uRainAmount; 
    
    float maxBlur = mix(3., 6., rainAmount) * uFogAmount * 5.0;
    float minBlur = 2.0 * uFogAmount;
    
    float staticDrops = S(-.5, 1., rainAmount)*2.;
    float layer1 = S(.25, .75, rainAmount);
    float layer2 = S(.0, .5, rainAmount);
    
    vec2 c = Drops(uv, t, staticDrops, layer1, layer2);
    vec2 e = vec2(.001, 0.);
    float cx = Drops(uv+e, t, staticDrops, layer1, layer2).x;
    float cy = Drops(uv+e.yx, t, staticDrops, layer1, layer2).x;
    vec2 n = vec2(cx-c.x, cy-c.x);
    
    n *= uRefraction * 10.0;
    float focus = mix(maxBlur-c.y, minBlur, S(.1, .2, c.x));
    
    vec3 col = textureLod(iChannel0, croppedUv + n, focus).rgb;
    
    // Simple Post Processing
    float vignette = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 1.5;
    col *= vignette;
    
    fragColor = vec4(col, 1.);
  }
`;

export const snowFragmentShaderSource = `#version 300 es
  precision highp float;
  ${commonUniforms}

  #define LAYERS 50
  #define DEPTH .5
  #define WIDTH .3
  #define SPEED .6

  void main() {
    vec2 croppedUv = getCenterCropUv();
    const mat3 p = mat3(13.323122,23.5112,21.71123,21.1212,28.7312,11.9312,21.8112,14.7212,61.3934);
    
    // Adapt uv for snow logic
    vec2 uv = iMouse.xy/iResolution.xy + vec2(1.,iResolution.y/iResolution.x)*vUv;
    
    vec3 acc = vec3(0.0);
    float dof = 5.*sin(iTime*.1);
    
    // Adjust snow parameters with uRainAmount (reusing for snow intensity)
    float layers = float(LAYERS) * (0.5 + uRainAmount);
    
    for (int i=0; i<LAYERS; i++) {
        if (float(i) > layers) break;
        float fi = float(i);
        vec2 q = uv*(1.+fi*DEPTH);
        q += vec2(q.y*(WIDTH*mod(fi*7.238917,1.)-WIDTH*.5),SPEED*iTime/(1.+fi*DEPTH*.03));
        vec3 n = vec3(floor(q),31.189+fi);
        vec3 m = floor(n)*.00001 + fract(n);
        vec3 mp = (31415.9+m)/fract(p*m);
        vec3 r = fract(mp);
        vec2 s = abs(mod(q,1.)-.5+.9*r.xy-.45);
        s += .01*abs(2.*fract(10.*q.yx)-1.); 
        float d = .6*max(s.x-s.y,s.x+s.y)+max(s.x,s.y)-.01;
        float edge = .005+.05*min(.5*abs(fi-5.-dof),1.);
        acc += vec3(smoothstep(edge,-edge,d)*(r.x/(1.+.02*fi*DEPTH)));
    }
    
    // Sample background with fog/blur
    float blur = uFogAmount * 5.0;
    vec3 bg = textureLod(iChannel0, croppedUv, blur).rgb;
    
    // Mix snow with background
    vec3 col = bg + acc;
    
    // Vignette
    float vignette = 1.0 - dot(vUv - 0.5, vUv - 0.5) * 1.5;
    col *= vignette;
    
    fragColor = vec4(col, 1.0);
  }
`;
