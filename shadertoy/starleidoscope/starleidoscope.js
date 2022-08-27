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
            "code": "#define NUM_LAYERS 10.\n\nmat2 Rot(float a) {\n  float c = cos(a), s = sin(a);\n  return mat2(c, -s, s, c);\n}\n\nfloat Star(vec2 uv, float flare) {\n    float col = 0.;\n    float d = length(uv);\n    float m = .02/d;\n    \n    float rays = max(0., 1. - abs(uv.x * uv.y * 1000.));\n    m += rays * flare;\n    uv *= Rot(3.1415/4.);\n    rays = max(0., 1. - abs(uv.x * uv.y * 1000.));\n    m += rays * .3 * flare;\n    \n    m *= smoothstep(1., .2, d);\n\n    return m;\n}\n\nfloat Hash21(vec2 p) {\n  p = fract(p * vec2(123.34, 456.21));\n  p += dot(p, p+45.32);\n  \n  return fract(p.x*p.y);\n}\n\nvec3 StarLayer(vec2 uv) {\n    vec3 col = vec3(0.);\n    \n    vec2 gv = fract(uv) - 0.5;\n    vec2 id = floor(uv);\n    \n    for(int y = -1; y <= 1; y++ ) {\n        for(int x = -1; x <= 1; x++) {\n            vec2 offs = vec2(x, y);\n\n            float n = Hash21(id + offs);\n            float size = fract(n*345.32);\n            \n            vec2 p = vec2(n, fract(n*34.));\n            \n            float star = Star(gv - offs - p + .5, smoothstep(.8, 1., size) * .6);\n            \n            vec3 hueShift = fract(n*2345.2 + dot(uv /420.,texture(iChannel0, vec2(0.25, 0.)).rg))*vec3(.2, .3, .9)*123.2;\n\n            vec3 color = sin(hueShift) * .5 + .5;\n            color = color * vec3(1., .25, 1.+size);\n\n            star *= sin(iTime*3.+n*6.2831)*.4+1.;\n            col += star * size * color;\n        }\n    }\n    \n    return col;\n\n}\n\nvec2 N(float angle) {\n  return vec2(sin(angle), cos(angle));\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = (fragCoord - 0.5*iResolution.xy)/iResolution.y;\n    vec2 M = (iMouse.xy - iResolution.xy*.5)/iResolution.y;\n    float t = iTime * .01;\n    \n    uv.x = abs(uv.x);\n    uv.y += tan((5./6.) * 3.1415) * .5;\n\n    vec2 n = N((5./6.) * 3.1415);\n    float d = dot(uv - vec2(.5, 0.), n);\n    uv -= n * max(0., d) * 2.;\n\n    // col += smoothstep(.01, .0, abs(d));\n\n    n = N((2./3.) * 3.1415);\n    float scale = 1.;\n    uv.x += 1.5 / 1.25;\n    for(int i=0; i<5; i++) {\n        scale *= 1.25;\n        uv *= 1.25;\n        uv.x -= 1.5;\n\n        uv.x = abs(uv.x);\n        uv.x -= 0.5;\n        uv -= n * min(0., dot(uv, n)) * 2.;\n    }\n\n \n    uv += M * 4.;\n\n    uv *= Rot(t);\n    vec3 col = vec3(0.);\n    \n    float layers = 10.;\n    \n    for(float i=0.; i < 1.; i+=1./NUM_LAYERS) {\n        float depth = fract(i+t);\n        float scale = mix(20., .5, depth);\n        float fade = depth * smoothstep(1., .9, depth);\n        col += StarLayer(uv * scale + i * 453.2) * fade;\n    }\n\n    fragColor = vec4(col,1.0);\n}",
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
          "id": "ftt3R7",
          "date": "1635883589",
          "viewed": 31211,
          "name": "Starleidoscope",
          "username": "DanielXMoore",
          "description": "Followed some TheArtOfCodeTutorials and ended up with this!",
          "likes": 39,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "tutorial"
          ],
          "hasliked": 0,
          "parentid": "ftd3zM",
          "parentname": "Starfield Tutorialzzz"
        }
      }
];

compileAndStart(jsnShader);