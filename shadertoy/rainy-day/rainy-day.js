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
                "id": "4sf3zn",
                "filepath": "/media/rain/background.jpg",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Heartfelt - by Martijn Steinrucken aka BigWings - 2017\n// Email:countfrolic@gmail.com Twitter:@The_ArtOfCode\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n\n// I revisited the rain effect I did for another shader. This one is better in multiple ways:\n// 1. The glass gets foggy.\n// 2. Drops cut trails in the fog on the glass.\n// 3. The amount of rain is adjustable (with Mouse.y)\n\n// To have full control over the rain, uncomment the HAS_HEART define \n\n// A video of the effect can be found here:\n// https://www.youtube.com/watch?v=uiF5Tlw22PI&feature=youtu.be\n\n// Music - Alone In The Dark - Vadim Kiselev\n// https://soundcloud.com/ahmed-gado-1/sad-piano-alone-in-the-dark\n// Rain sounds:\n// https://soundcloud.com/elirtmusic/sleeping-sound-rain-and-thunder-1-hours\n\n#define S(a, b, t) smoothstep(a, b, t)\n//#define CHEAP_NORMALS\n#define HAS_HEART\n#define USE_POST_PROCESSING\n\nvec3 N13(float p) {\n    //  from DAVE HOSKINS\n   vec3 p3 = fract(vec3(p) * vec3(.1031,.11369,.13787));\n   p3 += dot(p3, p3.yzx + 19.19);\n   return fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));\n}\n\nvec4 N14(float t) {\n\treturn fract(sin(t*vec4(123., 1024., 1456., 264.))*vec4(6547., 345., 8799., 1564.));\n}\nfloat N(float t) {\n    return fract(sin(t*12345.564)*7658.76);\n}\n\nfloat Saw(float b, float t) {\n\treturn S(0., b, t)*S(1., b, t);\n}\n\n\nvec2 DropLayer2(vec2 uv, float t) {\n    vec2 UV = uv;\n    \n    uv.y += t*0.75;\n    vec2 a = vec2(6., 1.);\n    vec2 grid = a*2.;\n    vec2 id = floor(uv*grid);\n    \n    float colShift = N(id.x); \n    uv.y += colShift;\n    \n    id = floor(uv*grid);\n    vec3 n = N13(id.x*35.2+id.y*2376.1);\n    vec2 st = fract(uv*grid)-vec2(.5, 0);\n    \n    float x = n.x-.5;\n    \n    float y = UV.y*20.;\n    float wiggle = sin(y+sin(y));\n    x += wiggle*(.5-abs(x))*(n.z-.5);\n    x *= .7;\n    float ti = fract(t+n.z);\n    y = (Saw(.85, ti)-.5)*.9+.5;\n    vec2 p = vec2(x, y);\n    \n    float d = length((st-p)*a.yx);\n    \n    float mainDrop = S(.4, .0, d);\n    \n    float r = sqrt(S(1., y, st.y));\n    float cd = abs(st.x-x);\n    float trail = S(.23*r, .15*r*r, cd);\n    float trailFront = S(-.02, .02, st.y-y);\n    trail *= trailFront*r*r;\n    \n    y = UV.y;\n    float trail2 = S(.2*r, .0, cd);\n    float droplets = max(0., (sin(y*(1.-y)*120.)-st.y))*trail2*trailFront*n.z;\n    y = fract(y*10.)+(st.y-.5);\n    float dd = length(st-vec2(x, y));\n    droplets = S(.3, 0., dd);\n    float m = mainDrop+droplets*r*trailFront;\n    \n    //m += st.x>a.y*.45 || st.y>a.x*.165 ? 1.2 : 0.;\n    return vec2(m, trail);\n}\n\nfloat StaticDrops(vec2 uv, float t) {\n\tuv *= 40.;\n    \n    vec2 id = floor(uv);\n    uv = fract(uv)-.5;\n    vec3 n = N13(id.x*107.45+id.y*3543.654);\n    vec2 p = (n.xy-.5)*.7;\n    float d = length(uv-p);\n    \n    float fade = Saw(.025, fract(t+n.z));\n    float c = S(.3, 0., d)*fract(n.z*10.)*fade;\n    return c;\n}\n\nvec2 Drops(vec2 uv, float t, float l0, float l1, float l2) {\n    float s = StaticDrops(uv, t)*l0; \n    vec2 m1 = DropLayer2(uv, t)*l1;\n    vec2 m2 = DropLayer2(uv*1.85, t)*l2;\n    \n    float c = s+m1.x+m2.x;\n    c = S(.3, 1., c);\n    \n    return vec2(c, max(m1.y*l0, m2.y*l1));\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;\n    vec2 UV = fragCoord.xy / iResolution.xy;\n    uv = uv * 0.4;\n\n    float T = iTime;\n\n    float t = T * 0.2;\n    float rainAmount = sin(T * .05) * .3 + .7;\n\n    // Removed zoom effect\n    // uv and UV are no longer modified by a zoom factor\n\n    float staticDrops = S(-.5, 1., rainAmount) * 1.;\n    float layer1 = S(.25, .75, rainAmount);\n    float layer2 = S(0., .5, rainAmount);\n\n    vec2 c = Drops(uv, t, staticDrops, layer1, layer2);\n\n    // Normal calculation (keeping as is)\n    #ifdef CHEAP_NORMALS\n    vec2 n = vec2(dFdx(c.x), dFdy(c.x));\n    #else\n    vec2 e = vec2(.001, 0.);\n    float cx = Drops(uv + e, t, staticDrops, layer1, layer2).x;\n    float cy = Drops(uv + e.yx, t, staticDrops, layer1, layer2).x;\n    vec2 n = vec2(cx - c.x, cy - c.x);\n    #endif\n\n    float maxBlur = mix(3., 6., rainAmount);\n    float minBlur = 2.;\n    float focus = mix(maxBlur - c.y, minBlur, S(.1, .2, c.x));\n    vec3 col = textureLod(iChannel0, UV + n, focus).rgb;\n\n    // Post-processing\n    #ifdef USE_POST_PROCESSING\n    t = (T + 3.) * .5;\n    float colFade = sin(t * .2) * .5 + .5;\n    col *= mix(vec3(1.), vec3(.8, .9, 1.3), colFade);\n    float fade = S(0., 10., T);\n    float lightning = sin(t * sin(t * 10.));\n    lightning *= pow(max(0., sin(t + sin(t))), 10.);\n    col *= 1. + lightning * fade;\n    col *= 1. - dot(UV -= .5, UV);\n    col *= fade;\n    #endif\n\n    fragColor = vec4(col, 1.);\n}\n",
            "name": "Image",
            "description": "",
            "type": "image"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": true,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": false,
          "mFlagKeyboard": false,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "mtyyzG",
          "date": "1700368220",
          "viewed": 21,
          "name": "Rainy Day New DS",
          "username": "DrieStone",
          "description": "Rainy Day (revised the Heartfelt rain to be a bit more generic)",
          "likes": 2,
          "published": 1,
          "flags": 2,
          "usePreview": 0,
          "tags": [
            "rain"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);