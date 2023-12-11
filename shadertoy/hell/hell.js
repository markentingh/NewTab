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
            "code": "// Copyright Inigo Quilez, 2013 - https://iquilezles.org/\n// I am the sole copyright owner of this Work.\n// You cannot host, display, distribute or share this Work neither\n// as it is or altered, here on Shadertoy or anywhere else, in any\n// form including physical and digital. You cannot use this Work in any\n// commercial or non-commercial product, website or project. You cannot\n// sell this Work and you cannot mint an NFTs of it or train a neural\n// network with it without permission. I share this Work for educational\n// purposes, and you can link to it, through an URL, proper attribution\n// and unmodified screenshot, as part of your educational material. If\n// these conditions are too restrictive please contact me and we'll\n// definitely work it out.\n\nfloat noise( in vec3 x )\n{\n    vec3 p = floor(x);\n    vec3 f = fract(x);\n\tf = f*f*(3.0-2.0*f);\n\t\n\tvec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;\n\tvec2 rg = textureLod( iChannel0, (uv+ 0.5)/256.0, 0.0 ).yx;\n\treturn mix( rg.x, rg.y, f.z );\n}\n\nvec4 map( vec3 p )\n{\n\tfloat den = 0.2 - p.y;\n\n    // invert space\t\n\tp = -7.0*p/dot(p,p);\n\n    // twist space\t\n\tfloat co = cos(den - 0.25*iTime);\n\tfloat si = sin(den - 0.25*iTime);\n\tp.xz = mat2(co,-si,si,co)*p.xz;\n\n    // smoke\t\n\tfloat f;\n\tvec3 q = p                          - vec3(0.0,1.0,0.0)*iTime;;\n    f  = 0.50000*noise( q ); q = q*2.02 - vec3(0.0,1.0,0.0)*iTime;\n    f += 0.25000*noise( q ); q = q*2.03 - vec3(0.0,1.0,0.0)*iTime;\n    f += 0.12500*noise( q ); q = q*2.01 - vec3(0.0,1.0,0.0)*iTime;\n    f += 0.06250*noise( q ); q = q*2.02 - vec3(0.0,1.0,0.0)*iTime;\n    f += 0.03125*noise( q );\n\n\tden = den + 4.0*f;\n\t\n\tvec3 col = mix( vec3(1.0,0.9,0.8), vec3(0.4,0.15,0.1), den ) + 0.05*sin(p);\n\t\n\treturn vec4( col, den );\n}\n\nvec3 raymarch( in vec3 ro, in vec3 rd, in vec2 pixel )\n{\n\tvec4 sum = vec4( 0.0 );\n\n    // dithering\t\n    float t = 0.05*fract( 10.5421*dot(vec2(0.0149451,0.038921),pixel));\n\t\n\tfor( int i=0; i<150; i++ )\n\t{\n\t\tvec3 pos = ro + t*rd;\n\t\tvec4 col = map( pos );\n        if( col.w>0.0 )\n        {\n            //float len = length(pos);\n            col.w = min(col.w,1.0);\n            \n            col.xyz *= mix( 3.1*vec3(1.0,0.5,0.05), vec3(0.48,0.53,0.5), clamp( (pos.y-0.2)/1.9, 0.0, 1.0 ) );\n            //col.xyz *= mix( 3.1*vec3(1.0,0.5,0.05), vec3(0.48,0.53,0.5), clamp( 0.35*col.w+0.15*dot(pos,pos), 0.0, 1.0 ) );\n\n            col.a *= 0.6;\n            col.rgb *= col.a;\n\n            sum = sum + col*(1.0 - sum.a);\t\n            if( sum.a > 0.99 ) break;\n        }\n\t\tt += 0.05;\n\t}\n\n\treturn clamp( sum.xyz, 0.0, 1.0 );\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 p = (2.0*fragCoord-iResolution.xy)/iResolution.y;\n\t\n    // camera\n    vec3 ro = 4.0*normalize(vec3(1.0, 1.5, 0.0));\n\tvec3 ta = vec3(0.0, 1.0, 0.0) + 0.05*(-1.0+2.0*textureLod( iChannel0, iTime*vec2(0.013,0.008), 0.0 ).xyz);\n\tfloat cr = 0.5*cos(0.7*iTime);\n\t\n\t// build ray\n    vec3 ww = normalize( ta - ro);\n    vec3 uu = normalize(cross( vec3(sin(cr),cos(cr),0.0), ww ));\n    vec3 vv = normalize(cross(ww,uu));\n    vec3 rd = normalize( p.x*uu + p.y*vv + 2.0*ww );\n\t\n    // raymarch\t\n\tvec3 col = raymarch( ro, rd, fragCoord );\n\t\n\t// color grade\n\tcol = col*0.5 + 0.5*col*col*(3.0-2.0*col);\n    \n    // vignetting\t\n    vec2 q = fragCoord.xy / iResolution.xy;\n\tcol *= 0.2 + 0.8*pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.1 );\n\t\n    fragColor = vec4( col, 1.0 );\n}\n",
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
          "id": "MdfGRX",
          "date": "1375342854",
          "viewed": 53705,
          "name": "Hell",
          "username": "iq",
          "description": "A variation of my Clouds shaders, made to look more like we are sinking to the very center of hell. Some postprocessed bloom effect would look awesome in this.",
          "likes": 649,
          "published": 3,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "procedural",
            "3d",
            "raymarching",
            "noise",
            "volumetric"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);