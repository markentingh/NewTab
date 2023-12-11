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
                "id": "XsBSR3",
                "filepath": "/media/a/cb49c003b454385aa9975733aff4571c62182ccdda480aaba9a8d250014f00ec.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "/*\n    \"Waves\" by @XorDev\n\n    X: X.com/XorDev/status/1722433311685906509\n    \n    <300 chars playlist: shadertoy.com/playlist/fXlGDN\n*/\n\nvoid mainImage( out vec4 O, vec2 I)\n{\n    O *= 0.;\n    vec3 p,r=iResolution;for(float i=texture(iChannel0,I/1024.).r+9.; i++<1e2; \n    O+=max(cos(dot(cos(p=vec3((I-r.xy*.5)/r.x*i,i+iTime/.1)*.2),sin(p.yzx*.8))*4.+p.z+vec4(0,1,2,3)),0.)/i*.7); \n}",
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
          "id": "cttyzf",
          "date": "1699495473",
          "viewed": 394,
          "name": "Waves [221]",
          "username": "Xor",
          "description": "https://twitter.com/XorDev/status/1722433311685906509",
          "likes": 43,
          "published": 1,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "3d",
            "golf"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);