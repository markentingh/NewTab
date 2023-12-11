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
              }
            ],
            "code": "// Copyright Inigo Quilez, 2014 - https://iquilezles.org/\n// I am the sole copyright owner of this Work.\n// You cannot host, display, distribute or share this Work neither\n// as it is or altered, here on Shadertoy or anywhere else, in any\n// form including physical and digital. You cannot use this Work in any\n// commercial or non-commercial product, website or project. You cannot\n// sell this Work and you cannot mint an NFTs of it or train a neural\n// network with it without permission. I share this Work for educational\n// purposes, and you can link to it, through an URL, proper attribution\n// and unmodified screenshot, as part of your educational material. If\n// these conditions are too restrictive please contact me and we'll\n// definitely work it out.\n\n#define AA 2\n\n// { 2d cell id, distance to border, distnace to center )\nvec4 hexagon( vec2 p ) \n{\n\tvec2 q = vec2( p.x*2.0*0.5773503, p.y + p.x*0.5773503 );\n\t\n\tvec2 pi = floor(q);\n\tvec2 pf = fract(q);\n\n\tfloat v = mod(pi.x + pi.y, 3.0);\n\n\tfloat ca = step(1.0,v);\n\tfloat cb = step(2.0,v);\n\tvec2  ma = step(pf.xy,pf.yx);\n\t\n    // distance to borders\n\tfloat e = dot( ma, 1.0-pf.yx + ca*(pf.x+pf.y-1.0) + cb*(pf.yx-2.0*pf.xy) );\n\n\t// distance to center\t\n\tp = vec2( q.x + floor(0.5+p.y/1.5), 4.0*p.y/3.0 )*0.5 + 0.5;\n\tfloat f = length( (fract(p) - 0.5)*vec2(1.0,0.85) );\t\t\n\t\n\treturn vec4( pi + ca - cb*ma, e, f );\n}\n\nfloat hash1( vec2  p ) { float n = dot(p,vec2(127.1,311.7) ); return fract(sin(n)*43758.5453); }\n\nfloat noise( in vec3 x )\n{\n    vec3 p = floor(x);\n    vec3 f = fract(x);\n\tf = f*f*(3.0-2.0*f);\n\tvec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;\n\tvec2 rg = textureLod( iChannel0, (uv+0.5)/256.0, 0.0 ).yx;\n\treturn mix( rg.x, rg.y, f.z );\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) \n{\n    vec3 tot = vec3(0.0);\n    \n    #if AA>1\n    for( int mm=0; mm<AA; mm++ )\n    for( int nn=0; nn<AA; nn++ )\n    {\n        vec2 off = vec2(mm,nn)/float(AA);\n        vec2 uv = (fragCoord+off)/iResolution.xy;\n        vec2 pos = (-iResolution.xy + 2.0*(fragCoord+off))/iResolution.y;\n    #else    \n    {\n        vec2 uv = fragCoord/iResolution.xy;\n        vec2 pos = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;\n    #endif\n\n        // distort\n        pos *= 1.2 + 0.15*length(pos);\n\n        // gray\n        vec4 h = hexagon(8.0*pos + 0.5*iTime);\n        float n = noise( vec3(0.3*h.xy+iTime*0.1,iTime) );\n        vec3 col = 0.15 + 0.15*hash1(h.xy+1.2)*vec3(1.0);\n        col *= smoothstep( 0.10, 0.11, h.z );\n        col *= smoothstep( 0.10, 0.11, h.w );\n        col *= 1.0 + 0.15*sin(40.0*h.z);\n        col *= 0.75 + 0.5*h.z*n;\n\n        // shadow\n        h = hexagon(6.0*(pos+0.1*vec2(-1.3,1.0)) + 0.6*iTime);\n        col *= 1.0-0.8*smoothstep(0.45,0.451,noise( vec3(0.3*h.xy+iTime*0.1,0.5*iTime) ));\n\n        // red\n        h = hexagon(6.0*pos + 0.6*iTime);\n        n = noise( vec3(0.3*h.xy+iTime*0.1,0.5*iTime) );\n        vec3 colb = 0.9 + 0.8*sin( hash1(h.xy)*1.5 + 2.0 + vec3(0.1,1.0,1.1) );\n        colb *= smoothstep( 0.10, 0.11, h.z );\n        colb *= 1.0 + 0.15*sin(40.0*h.z);\n\n        col = mix( col, colb, smoothstep(0.45,0.451,n) );\n        \n        col *= 2.5/(2.0+col);\n\n        col *= pow( 16.0*uv.x*(1.0-uv.x)*uv.y*(1.0-uv.y), 0.1 );\n\n        tot += col;\n\t}\t\n \t#if AA>1\n    tot /= float(AA*AA);\n    #endif\n        \n\tfragColor = vec4( tot, 1.0 );\n}",
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
          "id": "Xd2GR3",
          "date": "1394360615",
          "viewed": 32153,
          "name": "Hexagons - distance",
          "username": "iq",
          "description": "Very dirty maths for computing the distance to hexagon borders",
          "likes": 375,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "2d",
            "hexagons"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);