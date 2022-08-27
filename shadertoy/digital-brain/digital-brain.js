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
                "id": "XdXGzn",
                "filepath": "/media/a/3083c722c0c738cad0f468383167a0d246f91af2bfa373e9c5c094fb8c8413e0.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// by srtuss, 2013\n\n// rotate position around axis\nvec2 rotate(vec2 p, float a)\n{\n\treturn vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));\n}\n\n// 1D random numbers\nfloat rand(float n)\n{\n    return fract(sin(n) * 43758.5453123);\n}\n\n// 2D random numbers\nvec2 rand2(in vec2 p)\n{\n\treturn fract(vec2(sin(p.x * 591.32 + p.y * 154.077), cos(p.x * 391.32 + p.y * 49.077)));\n}\n\n// 1D noise\nfloat noise1(float p)\n{\n\tfloat fl = floor(p);\n\tfloat fc = fract(p);\n\treturn mix(rand(fl), rand(fl + 1.0), fc);\n}\n\n// voronoi distance noise, based on iq's articles\nfloat voronoi(in vec2 x)\n{\n\tvec2 p = floor(x);\n\tvec2 f = fract(x);\n\t\n\tvec2 res = vec2(8.0);\n\tfor(int j = -1; j <= 1; j ++)\n\t{\n\t\tfor(int i = -1; i <= 1; i ++)\n\t\t{\n\t\t\tvec2 b = vec2(i, j);\n\t\t\tvec2 r = vec2(b) - f + rand2(p + b);\n\t\t\t\n\t\t\t// chebyshev distance, one of many ways to do this\n\t\t\tfloat d = max(abs(r.x), abs(r.y));\n\t\t\t\n\t\t\tif(d < res.x)\n\t\t\t{\n\t\t\t\tres.y = res.x;\n\t\t\t\tres.x = d;\n\t\t\t}\n\t\t\telse if(d < res.y)\n\t\t\t{\n\t\t\t\tres.y = d;\n\t\t\t}\n\t\t}\n\t}\n\treturn res.y - res.x;\n}\n\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    float flicker = noise1(iTime * 2.0) * 0.8 + 0.4;\n\n    vec2 uv = fragCoord.xy / iResolution.xy;\n\tuv = (uv - 0.5) * 2.0;\n\tvec2 suv = uv;\n\tuv.x *= iResolution.x / iResolution.y;\n\t\n\t\n\tfloat v = 0.0;\n\t\n\t// that looks highly interesting:\n\t//v = 1.0 - length(uv) * 1.3;\n\t\n\t\n\t// a bit of camera movement\n\tuv *= 0.6 + sin(iTime * 0.1) * 0.4;\n\tuv = rotate(uv, sin(iTime * 0.3) * 1.0);\n\tuv += iTime * 0.4;\n\t\n\t\n\t// add some noise octaves\n\tfloat a = 0.6, f = 1.0;\n\t\n\tfor(int i = 0; i < 3; i ++) // 4 octaves also look nice, its getting a bit slow though\n\t{\t\n\t\tfloat v1 = voronoi(uv * f + 5.0);\n\t\tfloat v2 = 0.0;\n\t\t\n\t\t// make the moving electrons-effect for higher octaves\n\t\tif(i > 0)\n\t\t{\n\t\t\t// of course everything based on voronoi\n\t\t\tv2 = voronoi(uv * f * 0.5 + 50.0 + iTime);\n\t\t\t\n\t\t\tfloat va = 0.0, vb = 0.0;\n\t\t\tva = 1.0 - smoothstep(0.0, 0.1, v1);\n\t\t\tvb = 1.0 - smoothstep(0.0, 0.08, v2);\n\t\t\tv += a * pow(va * (0.5 + vb), 2.0);\n\t\t}\n\t\t\n\t\t// make sharp edges\n\t\tv1 = 1.0 - smoothstep(0.0, 0.3, v1);\n\t\t\n\t\t// noise is used as intensity map\n\t\tv2 = a * (noise1(v1 * 5.5 + 0.1));\n\t\t\n\t\t// octave 0's intensity changes a bit\n\t\tif(i == 0)\n\t\t\tv += v2 * flicker;\n\t\telse\n\t\t\tv += v2;\n\t\t\n\t\tf *= 3.0;\n\t\ta *= 0.7;\n\t}\n\n\t// slight vignetting\n\tv *= exp(-0.6 * length(suv)) * 1.2;\n\t\n\t// use texture channel0 for color? why not.\n\tvec3 cexp = texture(iChannel0, uv * 0.001).xyz * 3.0 + texture(iChannel0, uv * 0.01).xyz;//vec3(1.0, 2.0, 4.0);\n\tcexp *= 1.4;\n\t\n\t// old blueish color set\n\t//vec3 cexp = vec3(6.0, 4.0, 2.0);\n\t\n\tvec3 col = vec3(pow(v, cexp.x), pow(v, cexp.y), pow(v, cexp.z)) * 2.0;\n\t\n\tfragColor = vec4(col, 1.0);\n}",
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
          "id": "4sl3Dr",
          "date": "1371075939",
          "viewed": 15808,
          "name": "Digital Brain",
          "username": "srtuss",
          "description": "Some experiments with voronoi noise. I found many cool looking formulas, here is one of them. (Also try fullscreen!)\n*Now with colors.",
          "likes": 390,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "fractal",
            "voronoi",
            "noise",
            "tech",
            "rectangular"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);