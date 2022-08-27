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
                  "filter": "linear",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "/*\n    \"Mars\" by @XorDev\n\n    Just felt inspired to make a landscape.\n    Loosely inspired by Mars sunset photos.\n\n    //Tweet: twitter.com/XorDev/status/1563001681063079936\n    //Twigl: t.co/mh0wPftU4P\n\n    -5 Thanks to coyote\n*/\n\nvoid mainImage( out vec4 O, vec2 I)\n{\n    //Resolution for scaling\n    vec3 r = iResolution,\n    //Ray direction for raymarching and sky color\n    d = (vec3(I+I,r)-r)/r.x,\n    //Ray origin position\n    p = r-r,\n    //Iteration counter\n    i = p;\n    \n    //Loop 200 times\n    for(; i.x<2e2;\n        //Raymarch with heightmap\n        p += d*(p.y+.3-.3*texture(iChannel0,(p*r+iTime*r*.3).xz/4e2).r)/r)\n        //Swap octave scale every 5 iterations\n        r = exp(mod(++i,5.));\n    \n    //Set color using d, sun, depth and heightfog\n    O.grb = .5*d - .7/++p.z - min(.2+p+p,0.).y;\n}\n",
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
          "id": "flKcDW",
          "date": "1661484720",
          "viewed": 252,
          "name": "Mars [244 chars]",
          "username": "Xor",
          "description": "Just felt inspired to make a landscape.\nLoosely inspired by Mars sunset photos.",
          "likes": 24,
          "published": 1,
          "flags": 64,
          "usePreview": 0,
          "tags": [
            "fog",
            "heightmap",
            "golf"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);