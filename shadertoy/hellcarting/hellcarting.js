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
                "type": "cubemap",
                "id": "XsfGzn",
                "filepath": "/media/a/585f9546c092f53ded45332b343144396c0b2d70d9965f585ebc172080d8aa58.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 2,
                "type": "texture",
                "id": "Xsf3zn",
                "filepath": "/media/a/f735bee5b64ef98879dc618b016ecf7939a5756040c2cde21ccb15e69a6e1cfb.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "vec2 Path(vec2 x) {\n    vec2 p = floor(x);\n    vec2 f = fract(x);\n\tf = f*f*(3.-2.*f);\n\treturn textureLod(iChannel2, (p+vec2(37.5,17.5) + f)/256.0, 0.).xy;\n}\n\n#define S(x) vec4(Path(x*vec2(.04,.1))*vec2(6,9),0,0)\n\nvoid mainImage( out vec4 o, in vec2 C ) {\n    vec4 p = vec4(C.xy,0,0)/iResolution.xyxy-.5, d=p, t, c, s;\n    p.z += iTime*2.;\n    p -= S(p.z);\n    float x, r, w, i;\n    for(i=1.5; i>0.; i-=.01)\n    {\n        // Select one of 5 type of wood beam separation\n        vec2 z = (p.zz-2.)*.25;\n        z = Path(z - fract(z))*4.+.5;\n        z = (z - fract(z))/10.;\n        z = mix(z, vec2(1.), step(vec2(.4), z));      \n        z *= step(4., mod(p.z-2., 8.));\n\t\tfloat f = mix(z.x, z.y, step(p.x, 0.));                \n        \n        t = abs(mod(c=p+S(p.z), 8.)-4.);\n        w = step(0., c.y);\n        r = (step(2.6, t.x) - step(2.8, t.x)) * w;        \n        s = texture(iChannel0, (c.y*t.x > 3. ? t.zxy:t.yzx)-3.);\n        x = min(t.x + f, t.y)-s.x * (1.-r) - r*.8;  \n                       \n        if(x < .01) break;\n        p -= d*x*.5;\n     }\n    w = step(t.x, 0.8) * step(2.8, t.z) + step(2.8, t.x) * step(0., c.y);\n\to = p.wyyw*.02 + 1.3* mix(s, vec4(.8), r) * mix(vec4(1), vec4(1,.5,.2,1), w ) * i/p.w;\n}\n",
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
          "id": "Ms2fWW",
          "date": "1500502857",
          "viewed": 582,
          "name": "[SH17B] HellCarting",
          "username": "Trisomie21",
          "description": "Some say that the mine is endless... the one that knows never returned.\n",
          "likes": 22,
          "published": 1,
          "flags": 64,
          "usePreview": 0,
          "tags": [
            "sh17b"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);