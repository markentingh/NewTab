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
            "inputs": [],
            "code": "// hash without sine: https://www.shadertoy.com/view/4djSRW\nfloat hash11(float p) {\n\tvec3 p3  = fract(vec3(p) * vec3(.1031, .11369, .13787));\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\n// 1d smooth noise\nfloat snoise1d(float f) {\n    return\n        mix(\n            hash11(floor(f)),\n            hash11(floor(f+1.)),\n            smoothstep(0., 1., fract(f))\n        );\n}\n\n/* star shape (2d distance estimate)\n   p = input coordinate\n   n = number of sides\n   r = radius\n   i = inset amount (0.0=basic polygon, 1.0=typical star\n*/\nfloat StarDE(vec2 p, float n, float r, float i) {\n    float rep = floor(-atan(p.x, p.y)*(n/6.28)+.5) / (n/6.28);\n    float s, c;\n    p = mat2(c=cos(rep), s=-sin(rep), -s, c) * p;\n    float a = (i+1.) * 3.14 / n;\n    p = mat2(c=cos(a), s=-sin(a), -s, c) * vec2(-abs(p.x), p.y-r);\n    return length(max(vec2(0.), p));\n}\n\n// StarDE, but with eyes\n// l = look\nfloat Starguy(vec2 p, float n, float r, float i, vec2 l) {\n\n    // blink\n    float b = pow(abs(fract(.087*iTime+.1)-.5)*2., 72.);\n    \n    return\n        max(\n            StarDE(p, n, r, i),\n            \n            // eyes basic\n            //-length(vec2(abs(p.x)-r*.18, min(0., -abs(p.y)+r*.1)))+r*.11\n            \n            // eyes with look\n            -length(\n                vec2(\n                    min(0., -abs(abs(p.x+l.x)-r*.2)+r*b*.1),\n                    min(0., -abs(p.y+l.y)+r*(1.-b)*.1)\n                )\n            )+r*.13\n            \n        );\n}\n\nvoid mainImage(out vec4 fo, in vec2 fc) {\n\tvec2 p = (fc-iResolution.xy/2.) / iResolution.y;\n\t\n    // time\n    float t = .57 * iTime;\n    \n    // bob up and down\n    vec2 p2 = p;\n    p2.y += .025 * sin(4.*t);\n    \n    // warping (pinned inversion)\n    p2 = p2 / dot(p2, p2) - .17 * vec2(sin(t), cos(4.*t));\n    p2 = p2 / dot(p2, p2);\n    \n    vec2 look = .02 * vec2(cos(.71*t), sin(.24*t));\n    \n    // Starguy\n    float star = Starguy(p2, 5., .27, .7-length(p), look);\n    \n    // radiation base\n    float rad = pow(Starguy(p, 5., .27, .7-length(p), look), .5);\n    \n    // radiating waves\n    rad = snoise1d(24.*rad-2.*iTime) + .5*snoise1d(48.*rad-4.*iTime);\n    \n    // Starguy + radiation\n    vec3 col =\n        mix(\n            vec3(1.),\n            vec3(.1, .07, .25),\n            clamp(star/.01, 0., 1.)\n        ) + 4.8 * vec3(1., .5, .23) * (1.0 - pow(star, .1) ) * (1.-.04*rad);\n    \n    fo = vec4(col, 1.);\n}",
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
          "id": "DdKBzz",
          "date": "1697834386",
          "viewed": 237,
          "name": "Starguy",
          "username": "stb",
          "description": "~✨~",
          "likes": 41,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "star",
            "distance",
            "de",
            "shape",
            "estimate"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);