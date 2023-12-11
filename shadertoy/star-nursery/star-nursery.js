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
                "id": "Xsf3zn",
                "filepath": "/media/a/f735bee5b64ef98879dc618b016ecf7939a5756040c2cde21ccb15e69a6e1cfb.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
                "type": "musicstream",
                "id": "Xds3Rn",
                "filepath": "https://soundcloud.com/bumani/berlin-cocktail-bar-transit",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 2,
                "type": "volume",
                "id": "4sfGRr",
                "filepath": "/media/a/27012b4eadd0c3ce12498b867058e4f717ce79e10a99568cca461682d84a4b04.bin",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 3,
                "type": "texture",
                "id": "XsBSR3",
                "filepath": "/media/a/cb49c003b454385aa9975733aff4571c62182ccdda480aaba9a8d250014f00ec.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Built from the basics of'Clouds' Created by inigo quilez - iq/2013\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n\n// Edited by Dave Hoskins into \"Star Nursery\"\n// V.1.1 Some speed up in the ray-marching loop.\n\n//#define USE_3D_TEXTURE\n\n\nmat3 m = mat3( 0.30,  0.90,  0.60,\n              -0.90,  0.36, -0.48,\n              -0.60, -0.48,  0.34 );\n#define time (iTime+46.0)\n\n//----------------------------------------------------------------------\nfloat hash( float n )\n{\n    return fract(sin(n)*43758.5453123);\n}\nfloat hash2( vec2 p )\n{\n    return fract(sin(p.x+1131.1*p.y)*3751.5453);\n}\n//----------------------------------------------------------------------\nfloat noise( in vec2 x )\n{\n    vec2 p = floor(x);\n    vec2 f = fract(x);\n\n    f = f*f*(3.0-2.0*f);\n\n    float n = p.x + p.y*57.0;\n\n    float res = mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),\n                    mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y);\n\n    return res;\n}\n\n//----------------------------------------------------------------------\nfloat noise( in vec3 x )\n{\n    #ifdef USE_3D_TEXTURE\n\n    // 3D texture\n    return texture(iChannel2, x*.032, 0.0).x*1.06;\n    \n\t#else\n    \n    // Use 2D texture...\n    vec3 p = floor(x);\n    vec3 f = fract(x);\n\tf = f*f*(3.0-2.0*f);\n\n\tvec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;\n\tvec2 rg = texture( iChannel0, (uv+ 0.5)/256.0, -99.0).yx;\n\treturn mix( rg.x, rg.y, f.z );\n    \n    \n    #endif\n}\n\n//----------------------------------------------------------------------\nfloat fbm( vec3 p )\n{\n    float f;\n    f  = 1.600*noise( p ); p = m*p*2.02;\n    f += 0.3500*noise( p ); p = m*p*2.33;\n    f += 0.2250*noise( p ); p = m*p*2.03;\n    f += 0.0825*noise( p ); p = m*p*2.01;\n    return f;\n}\n\n//----------------------------------------------------------------------\nvec4 map( in vec3 p )\n{\n\tfloat d = 0.01- p.y;\n\n\tfloat f= fbm( p*1.0 - vec3(.4,0.3,-0.3)*time);\n\td += 4.0 * f;\n\n\td = clamp( d, 0.0, 1.0 );\n\t\n\tvec4 res = vec4( d );\n\tres.w = pow(res.y, .1);\n\n\tres.xyz = mix( .7*vec3(1.0,0.4,0.2), vec3(0.2,0.0,0.2), res.y * 1.);\n\tres.xyz = res.xyz + pow(abs(.95-f), 26.0) * 1.85;\n\treturn res;\n}\n\n\n//----------------------------------------------------------------------\nvec3 sundir = vec3(1.0,0.4,0.0);\nvec4 raymarch( in vec3 ro, in vec3 rd, in vec2 uv)\n{\n\tvec4 sum = vec4(0, 0, 0, 0);\n\n\t//float t = texture(iChannel3, rd.xy*3131.).x*.2;\n    float t = hash2(uv*11.*rd.xy)*.1;\n\tvec3 pos = vec3(0.0, 0.0, 0.0);\n\tfor(int i=0; i<130; i++)\n\t{\n\t\tif (sum.a > 0.8 || pos.y > 9.0 || pos.y < -2.0) continue;\n\t\tpos = ro + t*rd;\n\n\t\tvec4 col = map( pos );\n\t\t\n\t\t// Accumulate the alpha with the colour...\n\t\tcol.a *= 0.08;\n\t\tcol.rgb *= col.a;\n\n\t\tsum = sum + col*(1.0 - sum.a);\t\n    \tt += max(0.1,0.02*t);\n\t}\n\tsum.xyz /= (0.003+sum.w);\n\n\treturn clamp( sum, 0.0, 1.0 );\n}\n\n//----------------------------------------------------------------------\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 q = fragCoord.xy / iResolution.xy;\n    vec2 p = -1.0 + 2.0*q;\n    p.x *= iResolution.x/ iResolution.y;\n    vec2 mo = (-1.0 + 2.0 + iMouse.xy) / iResolution.xy;\n    \n    // Camera code...\n    vec3 ro = 5.6*normalize(vec3(cos(2.75-3.0*mo.x), .4-1.3*(mo.y-2.4), sin(2.75-2.0*mo.x)));\n\tvec3 ta = vec3(.0, 5.6, 2.4);\n    vec3 ww = normalize( ta - ro);\n    vec3 uu = normalize(cross( vec3(0.0,1.0,0.0), ww ));\n    vec3 vv = normalize(cross(ww,uu));\n    vec3 rd = normalize( p.x*uu + p.y*vv + 1.5*ww );\n\n\t// Ray march into the clouds adding up colour...\n    vec4 res = raymarch( ro, rd, fragCoord );\n\t\n\n\tfloat sun = clamp( dot(sundir,rd), 0.0, 2.0 );\n\tvec3 col = mix(vec3(.3,0.0,0.05), vec3(0.2,0.2,0.3), sqrt(max(rd.y, 0.001)));\n\tcol += .4*vec3(.4,.2,0.67)*sun;\n\tcol = clamp(col, 0.0, 1.0);\n\tcol += 0.43*vec3(.4,0.4,0.2)*pow( sun, 21.0 );\n\t\n\t// Do the stars...\n\tfloat v = 1.0/( 2. * ( 1. + rd.z ) );\n\tvec2 xy = vec2(rd.y * v, rd.x * v);\n    rd.z += time*.002;\n    float s = noise(rd.xz*134.0);\n\ts += noise(rd.xz*370.);\n\ts += noise(rd.xz*870.);\n\ts = pow(s,19.0) * 0.00000001 * max(rd.y, 0.0);\n\tif (s > 0.0)\n\t{\n\t\tvec3 backStars = vec3((1.0-sin(xy.x*20.0+time*13.0*rd.x+xy.y*30.0))*.5*s,s, s); \n\t\tcol += backStars;\n\t}\n\n\t// Mix in the clouds...\n\tcol = mix( col, res.xyz, res.w*1.3);\n\t\n\t#define CONTRAST 1.1\n\t#define SATURATION 1.15\n\t#define BRIGHTNESS 1.03\n\tcol = mix(vec3(.5), mix(vec3(dot(vec3(.2125, .7154, .0721), col*BRIGHTNESS)), col*BRIGHTNESS, SATURATION), CONTRAST);\n    \n    fragColor = vec4( col, 1.0 );\n}\n",
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
          "mFlagMusicStream": true
        },
        "info": {
          "id": "XsfGzH",
          "date": "1362167366",
          "viewed": 22647,
          "name": "Star Nursery",
          "username": "Dave_Hoskins",
          "description": "Reminded me of Hubble Star-Nursery images, well, a little bit anyway.\n\nJust sit and watch it full screen for a while, and feel the interstellar beginnings wash over you! :) ",
          "likes": 278,
          "published": 3,
          "flags": 64,
          "usePreview": 0,
          "tags": [
            "procedural",
            "3d",
            "raytracing",
            "3dnoise",
            "2dnoise",
            "soundcloud"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);