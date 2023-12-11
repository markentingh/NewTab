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
            "code": "/**\n Just fooling around basicly. Some sort of bloodstream. \n*/\n\n\n// https://iquilezles.org/articles/smin\nfloat smin( float a, float b, float k )\n{\n    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );\n    return mix( b, a, h ) - k*h*(1.0-h);\n}\n\nfloat cells(vec2 uv){  // Trimmed down.\n    uv = mix(sin(uv + vec2(1.57, 0)), sin(uv.yx*1.4 + vec2(1.57, 0)), .75);\n    return uv.x*uv.y*.3 + .7;\n}\n\n/*\nfloat cells(vec2 uv)\n{\n    float sx = cos(uv.x);\n    float sy = sin(uv.y);\n    sx = mix(sx, cos(uv.y * 1.4), .75);\n    sy = mix(sy, sin(uv.x * 1.4), .75);\n    return .3 * (sx * sy) + .7;\n}\n*/\n\nconst float BEAT = 4.0;\nfloat fbm(vec2 uv)\n{\n    \n    float f = 200.0;\n    vec2 r = (vec2(.9, .45));    \n    vec2 tmp;\n    float T = 100.0 + iTime * 1.3;\n    T += sin(iTime * BEAT) * .1;\n    // layers of cells with some scaling and rotation applied.\n    for (int i = 1; i < 8; ++i)\n    {\n        float fi = float(i);\n        uv.y -= T * .5;\n        uv.x -= T * .4;\n        tmp = uv;\n        \n        uv.x = tmp.x * r.x - tmp.y * r.y; \n        uv.y = tmp.x * r.y + tmp.y * r.x; \n        float m = cells(uv);\n        f = smin(f, m, .07);\n    }\n    return 1. - f;\n}\n\nvec3 g(vec2 uv)\n{\n    vec2 off = vec2(0.0, .03);\n    float t = fbm(uv);\n    float x = t - fbm(uv + off.yx);\n    float y = t - fbm(uv + off);\n    float s = .0025;\n    vec3 xv = vec3(s, x, 0);\n    vec3 yv = vec3(0, y, s);\n    return normalize(cross(xv, -yv)).xzy;\n}\n\nvec3 ld = normalize(vec3(1.0, 2.0, 3.));\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 uv = fragCoord.xy / iResolution.xy;\n    uv -= vec2(0.5);  \n    float a = iResolution.x / iResolution.y;\n    uv.y /= a;\n    vec2 ouv = uv;\n    float B = sin(iTime * BEAT);\n    uv = mix(uv, uv * sin(B), .035);\n    vec2 _uv = uv * 25.;\n    float f = fbm(_uv);\n    \n    // base color\n    fragColor = vec4(f);\n    fragColor.rgb *= vec3(1., .3 + B * .05, 0.1 + B * .05);\n    \n    vec3 v = normalize(vec3(uv, 1.));\n    vec3 grad = g(_uv);\n    \n    // spec\n    vec3 H = normalize(ld + v);\n    float S = max(0., dot(grad, H));\n    S = pow(S, 4.0) * .2;\n    fragColor.rgb += S * vec3(.4, .7, .7);\n    // rim\n    float R = 1.0 - clamp(dot(grad, v), .0, 1.);\n    fragColor.rgb = mix(fragColor.rgb, vec3(.8, .8, 1.), smoothstep(-.2, 2.9, R));\n    // edges\n    fragColor.rgb = mix(fragColor.rgb, vec3(0.), smoothstep(.45, .55, (max(abs(ouv.y * a), abs(ouv.x)))));\n    \n    // contrast\n    fragColor = smoothstep(.0, 1., fragColor);\n}",
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
          "id": "4ttXzj",
          "date": "1480858902",
          "viewed": 5913,
          "name": "BloodCells",
          "username": "kuvkar",
          "description": "Something that looks like blood.",
          "likes": 111,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "noise",
            "cells",
            "blood"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);