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
            "code": "// Noise animation - Lava\n// by nimitz (twitter: @stormoid)\n// https://www.shadertoy.com/view/lslXRS\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n// Contact the author for other licensing options\n\n//Somewhat inspired by the concepts behind \"flow noise\"\n//every octave of noise is modulated separately\n//with displacement using a rotated vector field\n\n//This is a more standard use of the flow noise\n//unlike my normalized vector field version (https://www.shadertoy.com/view/MdlXRS)\n//the noise octaves are actually displaced to create a directional flow\n\n//Sinus ridged fbm is used for better effect.\n\n#define time iTime*0.1\n\nfloat hash21(in vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }\nmat2 makem2(in float theta){float c = cos(theta);float s = sin(theta);return mat2(c,-s,s,c);}\nfloat noise( in vec2 x ){return texture(iChannel0, x*.01).x;}\n\nvec2 gradn(vec2 p)\n{\n\tfloat ep = .09;\n\tfloat gradx = noise(vec2(p.x+ep,p.y))-noise(vec2(p.x-ep,p.y));\n\tfloat grady = noise(vec2(p.x,p.y+ep))-noise(vec2(p.x,p.y-ep));\n\treturn vec2(gradx,grady);\n}\n\nfloat flow(in vec2 p)\n{\n\tfloat z=2.;\n\tfloat rz = 0.;\n\tvec2 bp = p;\n\tfor (float i= 1.;i < 7.;i++ )\n\t{\n\t\t//primary flow speed\n\t\tp += time*.6;\n\t\t\n\t\t//secondary flow speed (speed of the perceived flow)\n\t\tbp += time*1.9;\n\t\t\n\t\t//displacement field (try changing time multiplier)\n\t\tvec2 gr = gradn(i*p*.34+time*1.);\n\t\t\n\t\t//rotation of the displacement field\n\t\tgr*=makem2(time*6.-(0.05*p.x+0.03*p.y)*40.);\n\t\t\n\t\t//displace the system\n\t\tp += gr*.5;\n\t\t\n\t\t//add noise octave\n\t\trz+= (sin(noise(p)*7.)*0.5+0.5)/z;\n\t\t\n\t\t//blend factor (blending displaced system with base system)\n\t\t//you could call this advection factor (.5 being low, .95 being high)\n\t\tp = mix(bp,p,.77);\n\t\t\n\t\t//intensity scaling\n\t\tz *= 1.4;\n\t\t//octave scaling\n\t\tp *= 2.;\n\t\tbp *= 1.9;\n\t}\n\treturn rz;\t\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 p = fragCoord.xy / iResolution.xy-0.5;\n\tp.x *= iResolution.x/iResolution.y;\n\tp*= 3.;\n\tfloat rz = flow(p);\n\t\n\tvec3 col = vec3(.2,0.07,0.01)/rz;\n\tcol=pow(col,vec3(1.4));\n\tfragColor = vec4(col,1.0);\n}",
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
          "id": "lslXRS",
          "date": "1403495073",
          "viewed": 14652,
          "name": "Noise animation - Lava",
          "username": "nimitz",
          "description": "Playing with different ways of animating noise. In this version, the noise is made using the ideas behind \"flow noise\", I'm not quite sure it qualifies though, but it looks decent enough.",
          "likes": 205,
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