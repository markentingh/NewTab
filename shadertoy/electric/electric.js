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
            "code": "// Noise animation - Electric\n// by nimitz (stormoid.com) (twitter: @stormoid)\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n// Contact the author for other licensing options\n\n//The domain is displaced by two fbm calls one for each axis.\n//Turbulent fbm (aka ridged) is used for better effect.\n\n#define time iTime*0.15\n#define tau 6.2831853\n\nmat2 makem2(in float theta){float c = cos(theta);float s = sin(theta);return mat2(c,-s,s,c);}\nfloat noise( in vec2 x ){return texture(iChannel0, x*.01).x;}\n\nfloat fbm(in vec2 p)\n{\t\n\tfloat z=2.;\n\tfloat rz = 0.;\n\tvec2 bp = p;\n\tfor (float i= 1.;i < 6.;i++)\n\t{\n\t\trz+= abs((noise(p)-0.5)*2.)/z;\n\t\tz = z*2.;\n\t\tp = p*2.;\n\t}\n\treturn rz;\n}\n\nfloat dualfbm(in vec2 p)\n{\n    //get two rotated fbm calls and displace the domain\n\tvec2 p2 = p*.7;\n\tvec2 basis = vec2(fbm(p2-time*1.6),fbm(p2+time*1.7));\n\tbasis = (basis-.5)*.2;\n\tp += basis;\n\t\n\t//coloring\n\treturn fbm(p*makem2(time*0.2));\n}\n\nfloat circ(vec2 p) \n{\n\tfloat r = length(p);\n\tr = log(sqrt(r));\n\treturn abs(mod(r*4.,tau)-3.14)*3.+.2;\n\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\t//setup system\n\tvec2 p = fragCoord.xy / iResolution.xy-0.5;\n\tp.x *= iResolution.x/iResolution.y;\n\tp*=4.;\n\t\n    float rz = dualfbm(p);\n\t\n\t//rings\n\tp /= exp(mod(time*10.,3.14159));\n\trz *= pow(abs((0.1-circ(p))),.9);\n\t\n\t//final color\n\tvec3 col = vec3(.2,0.1,0.4)/rz;\n\tcol=pow(abs(col),vec3(.99));\n\tfragColor = vec4(col,1.);\n}",
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
          "id": "ldlXRS",
          "date": "1403493968",
          "viewed": 33388,
          "name": "Noise animation - Electric",
          "username": "nimitz",
          "description": "Playing with different ways of animating noise. In this version, the domain is displaced by two random fbm noise calls (one for each axis).",
          "likes": 527,
          "published": 1,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "procedural",
            "2d",
            "noise"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);