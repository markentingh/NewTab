var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [],
            "inputs": [],
            "code": "// https://www.shadertoy.com/view/MdXSzS\n// The Big Bang - just a small explosion somewhere in a massive Galaxy of Universes.\n// Outside of this there's a massive galaxy of 'Galaxy of Universes'... etc etc. :D\n\n// To fake a perspective it takes advantage of the screen being wider than it is tall.\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 uv = (fragCoord.xy / iResolution.xy) - .5;\n\tfloat t = iTime * .1 + ((.25 + .05 * sin(iTime * .1))/(length(uv.xy) + .07)) * 2.2;\n\tfloat si = sin(t);\n\tfloat co = cos(t);\n\tmat2 ma = mat2(co, si, -si, co);\n\n\tfloat v1, v2, v3;\n\tv1 = v2 = v3 = 0.0;\n\t\n\tfloat s = 0.0;\n\tfor (int i = 0; i < 90; i++)\n\t{\n\t\tvec3 p = s * vec3(uv, 0.0);\n\t\tp.xy *= ma;\n\t\tp += vec3(.22, .3, s - 1.5 - sin(iTime * .13) * .1);\n\t\tfor (int i = 0; i < 8; i++)\tp = abs(p) / dot(p,p) - 0.659;\n\t\tv1 += dot(p,p) * .0015 * (1.8 + sin(length(uv.xy * 13.0) + .5  - iTime * .2));\n\t\tv2 += dot(p,p) * .0013 * (1.5 + sin(length(uv.xy * 14.5) + 1.2 - iTime * .3));\n\t\tv3 += length(p.xy*10.) * .0003;\n\t\ts  += .035;\n\t}\n\t\n\tfloat len = length(uv);\n\tv1 *= smoothstep(.7, .0, len);\n\tv2 *= smoothstep(.5, .0, len);\n\tv3 *= smoothstep(.9, .0, len);\n\t\n\tvec3 col = vec3( v3 * (1.5 + sin(iTime * .2) * .4),\n\t\t\t\t\t(v1 + v3) * .3,\n\t\t\t\t\t v2) + smoothstep(0.2, .0, len) * .85 + smoothstep(.0, .6, v3) * .3;\n\n\tfragColor=vec4(min(pow(abs(col), vec3(1.2)), 1.0), 1.0);\n}",
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
          "mFlagMusicStream": true
        },
        "info": {
          "id": "MdXSzS",
          "date": "1403191786",
          "viewed": 35777,
          "name": "Galaxy of Universes",
          "username": "Dave_Hoskins",
          "description": "Big Bang? *pfft* It's just a small explosion somewhere in a rotating Galaxy of Universes!\nThanks to Kali for his fractal formula.",
          "likes": 303,
          "published": 3,
          "flags": 64,
          "usePreview": 0,
          "tags": [
            "galaxy",
            "universes"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);