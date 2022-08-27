var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [],
            "inputs": [],
            "code": "// http://www.fractalforums.com/new-theories-and-research/very-simple-formula-for-fractal-patterns/\nfloat field(in vec3 p) {\n\tfloat strength = 7. + .03 * log(1.e-6 + fract(sin(iTime) * 4373.11));\n\tfloat accum = 0.;\n\tfloat prev = 0.;\n\tfloat tw = 0.;\n\tfor (int i = 0; i < 32; ++i) {\n\t\tfloat mag = dot(p, p);\n\t\tp = abs(p) / mag + vec3(-.5, -.4, -1.5);\n\t\tfloat w = exp(-float(i) / 7.);\n\t\taccum += w * exp(-strength * pow(abs(mag - prev), 2.3));\n\t\ttw += w;\n\t\tprev = mag;\n\t}\n\treturn max(0., 5. * accum / tw - .7);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n\tvec2 uv = 2. * fragCoord.xy / iResolution.xy - 1.;\n\tvec2 uvs = uv * iResolution.xy / max(iResolution.x, iResolution.y);\n\tvec3 p = vec3(uvs / 4., 0) + vec3(1., -1.3, 0.);\n\tp += .2 * vec3(sin(iTime / 16.), sin(iTime / 12.),  sin(iTime / 128.));\n\tfloat t = field(p);\n\tfloat v = (1. - exp((abs(uv.x) - 1.) * 6.)) * (1. - exp((abs(uv.y) - 1.) * 6.));\n\tfragColor = mix(.4, 1., v) * vec4(1.8 * t * t * t, 1.4 * t * t, t, 1.0);\n}",
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
          "id": "lslGWr",
          "date": "1367919742",
          "viewed": 11274,
          "name": "Simplicity",
          "username": "JoshP",
          "description": "Beauty in simplicity.",
          "likes": 250,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "2d",
            "fractal"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);