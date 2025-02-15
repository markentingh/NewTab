var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [],
            "inputs": [
              {
                "channel": 0,
                "type": "texture",
                "id": "Xsf3zn",
                "filepath": "/media/a/f735bee5b64ef98879dc618b016ecf7939a5756040c2cde21ccb15e69a6e1cfb.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Interstellar\n// Hazel Quantock\n// This code is licensed under the CC0 license http://creativecommons.org/publicdomain/zero/1.0/\n\nconst float tau = 6.28318530717958647692;\n\n// Gamma correction\n#define GAMMA (2.2)\n\nvec3 ToLinear( in vec3 col )\n{\n\t// simulate a monitor, converting colour values into light values\n\treturn pow( col, vec3(GAMMA) );\n}\n\nvec3 ToGamma( in vec3 col )\n{\n\t// convert back into colour values, so the correct light will come out of the monitor\n\treturn pow( col, vec3(1.0/GAMMA) );\n}\n\nvec4 Noise( in ivec2 x )\n{\n\treturn texture( iChannel0, (vec2(x)+0.5)/256.0, -100.0 );\n}\n\nvec4 Rand( in int x )\n{\n\tvec2 uv;\n\tuv.x = (float(x)+0.5)/256.0;\n\tuv.y = (floor(uv.x)+0.5)/256.0;\n\treturn texture( iChannel0, uv, -100.0 );\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec3 ray;\n\tray.xy = 2.0*(fragCoord.xy-iResolution.xy*.5)/iResolution.x;\n\tray.z = 1.0;\n\n\tfloat offset = iTime*.5;\t\n\tfloat speed2 = (cos(offset)+1.0)*2.0;\n\tfloat speed = speed2+.1;\n\toffset += sin(offset)*.96;\n\toffset *= 2.0;\n\t\n\t\n\tvec3 col = vec3(0);\n\t\n\tvec3 stp = ray/max(abs(ray.x),abs(ray.y));\n\t\n\tvec3 pos = 2.0*stp+.5;\n\tfor ( int i=0; i < 20; i++ )\n\t{\n\t\tfloat z = Noise(ivec2(pos.xy)).x;\n\t\tz = fract(z-offset);\n\t\tfloat d = 50.0*z-pos.z;\n\t\tfloat w = pow(max(0.0,1.0-8.0*length(fract(pos.xy)-.5)),2.0);\n\t\tvec3 c = max(vec3(0),vec3(1.0-abs(d+speed2*.5)/speed,1.0-abs(d)/speed,1.0-abs(d-speed2*.5)/speed));\n\t\tcol += 1.5*(1.0-z)*c*w;\n\t\tpos += stp;\n\t}\n\t\n\tfragColor = vec4(ToGamma(col),1.0);\n}",
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
          "id": "Xdl3D2",
          "date": "1380060986",
          "viewed": 17320,
          "name": "Interstellar",
          "username": "TekF",
          "description": "March through a 2D grid, offsetting stars along z for each grid cell. This is much faster than doing a loop over all stars, but creates some artefacts.",
          "likes": 356,
          "published": 1,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "starfield"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);