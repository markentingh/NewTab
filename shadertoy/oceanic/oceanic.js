var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [
              {
                "channel": 0,
                "id": "4dfGRr"
              }
            ],
            "inputs": [
              {
                "channel": 0,
                "type": "texture",
                "id": "4dXGzn",
                "filepath": "/media/a/0c7bf5fe9462d5bffbd11126e82908e39be3ce56220d900f633d58fb432e56f5.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Clouds: slice based volumetric height-clouds with god-rays, density, sun-radiance/shadow\n// and \n// Water: simple reflecting sky/sun and cloud shaded height-modulated waves\n//\n// Created by Frank Hugenroth 03/2013\n//\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n//\n// noise and raymarching based on concepts and code from shaders by inigo quilez\n//\n\n// some variables to change :)\n\n#define RENDER_GODRAYS    1    // set this to 1 to enable god-rays\n//#define RENDER_GODRAYS    0    // disable god-rays\n\n#define RENDER_CLOUDS 1\n#define RENDER_WATER   1\n\nfloat waterlevel = 70.0;        // height of the water\nfloat wavegain   = 1.0;       // change to adjust the general water wave level\nfloat large_waveheight = 1.0; // change to adjust the \"heavy\" waves (set to 0.0 to have a very still ocean :)\nfloat small_waveheight = 1.0; // change to adjust the small waves\n\nvec3 fogcolor    = vec3( 0.5, 0.7, 1.1 );              \nvec3 skybottom   = vec3( 0.6, 0.8, 1.2 );\nvec3 skytop      = vec3(0.05, 0.2, 0.5);\nvec3 reflskycolor= vec3(0.025, 0.10, 0.20);\nvec3 watercolor  = vec3(0.2, 0.25, 0.3);\n\nvec3 light       = normalize( vec3(  0.1, 0.25,  0.9 ) );\n\n\n\n\n\n\n\n\n\n// random/hash function              \nfloat hash( float n )\n{\n  return fract(cos(n)*41415.92653);\n}\n\n// 2d noise function\nfloat noise(vec2 p)\n{\n  return textureLod(iChannel0,p*vec2(1./256.),0.0).x;\n}\n\n\n// 3d noise function\nfloat noise( in vec3 x )\n{\n  vec3 p  = floor(x);\n  vec3 f  = smoothstep(0.0, 1.0, fract(x));\n  float n = p.x + p.y*57.0 + 113.0*p.z;\n\n  return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),\n    mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),\n    mix(mix( hash(n+113.0), hash(n+114.0),f.x),\n    mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);\n}\n\n\nmat3 m = mat3( 0.00,  1.60,  1.20, -1.60,  0.72, -0.96, -1.20, -0.96,  1.28 );\n\n// Fractional Brownian motion\nfloat fbm( vec3 p )\n{\n  float f = 0.5000*noise( p ); p = m*p*1.1;\n  f += 0.2500*noise( p ); p = m*p*1.2;\n  f += 0.1666*noise( p ); p = m*p;\n  f += 0.0834*noise( p );\n  return f;\n}\n\nmat2 m2 = mat2(1.6,-1.2,1.2,1.6);\n\n// Fractional Brownian motion\nfloat fbm( vec2 p )\n{\n  float f = 0.5000*noise( p ); p = m2*p;\n  f += 0.2500*noise( p ); p = m2*p;\n  f += 0.1666*noise( p ); p = m2*p;\n  f += 0.0834*noise( p );\n  return f;\n}\n\n\n// this calculates the water as a height of a given position\nfloat water( vec2 p )\n{\n  float height = waterlevel;\n\n  vec2 shift1 = 0.001*vec2( iTime*160.0*2.0, iTime*120.0*2.0 );\n  vec2 shift2 = 0.001*vec2( iTime*190.0*2.0, -iTime*130.0*2.0 );\n\n  // coarse crossing 'ocean' waves...\n  float wave = 0.0;\n  wave += sin(p.x*0.021  + shift2.x)*4.5;\n  wave += sin(p.x*0.0172+p.y*0.010 + shift2.x*1.121)*4.0;\n  wave -= sin(p.x*0.00104+p.y*0.005 + shift2.x*0.121)*4.0;\n  // ...added by some smaller faster waves...\n  wave += sin(p.x*0.02221+p.y*0.01233+shift2.x*3.437)*5.0;\n  wave += sin(p.x*0.03112+p.y*0.01122+shift2.x*4.269)*2.5 ;\n  wave *= large_waveheight;\n  wave -= fbm(p*0.004-shift2*.5)*small_waveheight*24.;\n  // ...added by some distored random waves (which makes the water looks like water :)\n\n  float amp = 6.*small_waveheight;\n  shift1 *= .3;\n  for (int i=0; i<7; i++)\n  {\n    wave -= abs(sin((noise(p*0.01+shift1)-.5)*3.14))*amp;\n    amp *= .51;\n    shift1 *= 1.841;\n    p *= m2*0.9331;\n  }\n  \n  height += wave;\n  return height;\n}\n\n\n// cloud intersection raycasting\nfloat trace_fog(in vec3 rStart, in vec3 rDirection )\n{\n#if RENDER_CLOUDS\n  // makes the clouds moving...\n  vec2 shift = vec2( iTime*80.0, iTime*60.0 );\n  float sum = 0.0;\n  // use only 12 cloud-layers ;)\n  // this improves performance but results in \"god-rays shining through clouds\" effect (sometimes)...\n  float q2 = 0., q3 = 0.;\n  for (int q=0; q<10; q++)\n  {\n    float c = (q2+350.0-rStart.y) / rDirection.y;// cloud distance\n    vec3 cpos = rStart + c*rDirection + vec3(831.0, 321.0+q3-shift.x*0.2, 1330.0+shift.y*3.0); // cloud position\n    float alpha = smoothstep(0.5, 1.0, fbm( cpos*0.0015 )); // cloud density\n\tsum += (1.0-sum)*alpha; // alpha saturation\n    if (sum>0.98)\n        break;\n    q2 += 120.;\n    q3 += 0.15;\n  }\n  \n  return clamp( 1.0-sum, 0.0, 1.0 );\n#else\n  return 1.0;\n#endif\n}\n\n// fog and water intersection function.\n// 1st: collects fog intensity while traveling\n// 2nd: check if hits the water surface and returns the distance\nbool trace(in vec3 rStart, in vec3 rDirection, in float sundot, out float fog, out float dist)\n{\n  float h = 20.0;\n  float t = 0.0;\n  float st = 1.0;\n  float alpha = 0.1;\n  float asum = 0.0;\n  vec3 p = rStart;\n\t\n  for( int j=1000; j<1120; j++ )\n  {\n    // some speed-up if all is far away...\n    if( t>500.0 ) \n      st = 2.0;\n    else if( t>800.0 ) \n      st = 5.0;\n    else if( t>1000.0 ) \n      st = 12.0;\n\n    p = rStart + t*rDirection; // calc current ray position\n\n#if RENDER_GODRAYS\n    if (rDirection.y>0. && sundot > 0.001 && t>400.0 && t < 2500.0)\n    {\n      alpha = sundot * clamp((p.y-waterlevel)/waterlevel, 0.0, 1.0) * st * 0.024*smoothstep(0.80, 1.0, trace_fog(p,light));\n      asum  += (1.0-asum)*alpha;\n      if (asum > 0.9)\n        break;\n    }\n#endif\n\n    h = p.y - water(p.xz);\n\n    if( h<0.1 ) // hit the water?\n    {\n      dist = t; \n      fog = asum;\n      return true;\n    }\n\n    if( p.y>450.0 ) // lost in space? quit...\n      break;\n    \n    // speed up ray if possible...    \n    if(rDirection.y > 0.0) // look up (sky!) -> make large steps\n      t += 30.0 * st;\n    else\n      t += max(1.0,1.0*h)*st;\n  }\n\n  dist = t; \n  fog = asum;\n  if (h<10.0)\n   return true;\n  return false;\n}\n\n\nvec3 camera( float time )\n{\n  return vec3( 500.0 * sin(1.5+1.57*time), 0.0, 1200.0*time );\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n  vec2 xy = -1.0 + 2.0*fragCoord.xy / iResolution.xy;\n  vec2 s = xy*vec2(1.75,1.0);\n\n  // get camera position and view direction\n  float time = (iTime+13.5+44.)*.05;\n  vec3 campos = camera( time );\n  vec3 camtar = camera( time + 0.4 );\n  campos.y = max(waterlevel+30.0, waterlevel+90.0 + 60.0*sin(time*2.0));\n  camtar.y = campos.y*0.5;\n\n  float roll = 0.14*sin(time*1.2);\n  vec3 cw = normalize(camtar-campos);\n  vec3 cp = vec3(sin(roll), cos(roll),0.0);\n  vec3 cu = normalize(cross(cw,cp));\n  vec3 cv = normalize(cross(cu,cw));\n  vec3 rd = normalize( s.x*cu + s.y*cv + 1.6*cw );\n\n  float sundot = clamp(dot(rd,light),0.0,1.0);\n\n  vec3 col;\n  float fog=0.0, dist=0.0;\n\n  if (!trace(campos,rd,sundot, fog, dist))\n  {\n    // render sky\n    float t = pow(1.0-0.7*rd.y, 15.0);\n    col = 0.8*(skybottom*t + skytop*(1.0-t));\n    // sun\n    col += 0.47*vec3(1.6,1.4,1.0)*pow( sundot, 350.0 );\n    // sun haze\n    col += 0.4*vec3(0.8,0.9,1.0)*pow( sundot, 2.0 );\n\n#if RENDER_CLOUDS\n    // CLOUDS\n    vec2 shift = vec2( iTime*80.0, iTime*60.0 );\n    vec4 sum = vec4(0,0,0,0); \n    for (int q=1000; q<1100; q++) // 100 layers\n    {\n      float c = (float(q-1000)*12.0+350.0-campos.y) / rd.y; // cloud height\n      vec3 cpos = campos + c*rd + vec3(831.0, 321.0+float(q-1000)*.15-shift.x*0.2, 1330.0+shift.y*3.0); // cloud position\n      float alpha = smoothstep(0.5, 1.0, fbm( cpos*0.0015 ))*.9; // fractal cloud density\n      vec3 localcolor = mix(vec3( 1.1, 1.05, 1.0 ), 0.7*vec3( 0.4,0.4,0.3 ), alpha); // density color white->gray\n      alpha = (1.0-sum.w)*alpha; // alpha/density saturation (the more a cloud layer's density, the more the higher layers will be hidden)\n      sum += vec4(localcolor*alpha, alpha); // sum up weightened color\n      \n      if (sum.w>0.98)\n        break;\n    }\n    float alpha = smoothstep(0.7, 1.0, sum.w);\n    sum.rgb /= sum.w+0.0001;\n\n    // This is an important stuff to darken dense-cloud parts when in front (or near)\n    // of the sun (simulates cloud-self shadow)\n    sum.rgb -= 0.6*vec3(0.8, 0.75, 0.7)*pow(sundot,13.0)*alpha;\n    // This brightens up the low-density parts (edges) of the clouds (simulates light scattering in fog)\n    sum.rgb += 0.2*vec3(1.3, 1.2, 1.0)* pow(sundot,5.0)*(1.0-alpha);\n\n    col = mix( col, sum.rgb , sum.w*(1.0-t) );\n#endif\n\n    // add god-rays\n    col += vec3(0.5, 0.4, 0.3)*fog;\n  }\n  else\n  {\n#if RENDER_WATER        \n    //  render water\n    \n    vec3 wpos = campos + dist*rd; // calculate position where ray meets water\n\n    // calculate water-mirror\n    vec2 xdiff = vec2(0.1, 0.0)*wavegain*4.;\n    vec2 ydiff = vec2(0.0, 0.1)*wavegain*4.;\n\n    // get the reflected ray direction\n    rd = reflect(rd, normalize(vec3(water(wpos.xz-xdiff) - water(wpos.xz+xdiff), 1.0, water(wpos.xz-ydiff) - water(wpos.xz+ydiff))));  \n    float refl = 1.0-clamp(dot(rd,vec3(0.0, 1.0, 0.0)),0.0,1.0);\n  \n    float sh = smoothstep(0.2, 1.0, trace_fog(wpos+20.0*rd,rd))*.7+.3;\n    // water reflects more the lower the reflecting angle is...\n    float wsky   = refl*sh;     // reflecting (sky-color) amount\n    float wwater = (1.0-refl)*sh; // water-color amount\n\n    float sundot = clamp(dot(rd,light),0.0,1.0);\n\n    // watercolor\n\n    col = wsky*reflskycolor; // reflecting sky-color \n    col += wwater*watercolor;\n    col += vec3(.003, .005, .005) * (wpos.y-waterlevel+30.);\n\n    // Sun\n    float wsunrefl = wsky*(0.5*pow( sundot, 10.0 )+0.25*pow( sundot, 3.5)+.75*pow( sundot, 300.0));\n    col += vec3(1.5,1.3,1.0)*wsunrefl; // sun reflection\n\n#endif\n\n    // global depth-fog\n    float fo = 1.0-exp(-pow(0.0003*dist, 1.5));\n    vec3 fco = fogcolor + 0.6*vec3(0.6,0.5,0.4)*pow( sundot, 4.0 );\n    col = mix( col, fco, fo );\n\n    // add god-rays\n    col += vec3(0.5, 0.4, 0.3)*fog; \n  }\n\n  fragColor=vec4(col,1.0);\n}\n\n\n",
            "name": "Image",
            "description": "",
            "type": "image"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": false,
          "mFlagKeyboard": false,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "4sXGRM",
          "date": "1364819304",
          "viewed": 42649,
          "name": "Oceanic",
          "username": "frankenburgh",
          "description": "This shader demonstrates volumetric (multi sliced) height-clouds with density (based on fractal noise, 'against sun'-shading and god-rays) and a reflecting water simulation.\n\nEnable/Disable God-Rays by changing the code (see comment)",
          "likes": 392,
          "published": 1,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "procedural",
            "3d",
            "raymarching",
            "waves",
            "sea",
            "raycasting",
            "clouds",
            "water",
            "ocean",
            "godrays",
            "lightrays",
            "sunrays",
            "waterrender",
            "oceanic"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);